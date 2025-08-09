import { renderMinimalEmail } from '@/lib/email/templates/minimalist'
import { Resend } from 'resend'

export type Recipient = {
  email: string
  username: string
}

export type SendBatchResultItem = {
  to: string
  success: boolean
  id?: string
  fromUsed?: 'primary' | 'fallback'
  error?: string
  errorRaw?: string
}

export type SendBatchResult = {
  success: boolean
  summary: {
    total: number
    succeeded: number
    failed: number
  }
  results: SendBatchResultItem[]
}

export async function sendBatchEmails(params: {
  title: string
  body: string
  recipients: Recipient[]
}): Promise<SendBatchResult> {
  const { title, body, recipients } = params

  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      summary: { total: 0, succeeded: 0, failed: 0 },
      results: [
        { to: 'N/A', success: false, error: 'RESEND_API_KEY is not configured' },
      ],
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress: string = process.env.RESEND_FROM_EMAIL ?? '興大學伴酷系統 <nchuetutor@nflincu.com>'
  const fallbackFromAddress: string = process.env.RESEND_FALLBACK_FROM_EMAIL ?? '興大學伴酷系統 <onboarding@resend.dev>'

  // Basic email validation
  const invalidEmails = recipients
    .map((r) => r.email)
    .filter((email) => !/^\S+@\S+\.\S+$/.test(email))
  if (invalidEmails.length > 0) {
    return {
      success: false,
      summary: { total: 0, succeeded: 0, failed: 0 },
      results: [
        { to: 'N/A', success: false, error: `Invalid recipient emails: ${invalidEmails.join(', ')}` },
      ],
    }
  }

  const subject = title
  const sendPromises = recipients.map(async (recipient): Promise<SendBatchResultItem> => {
    const html = renderMinimalEmail({ username: recipient.username, title, body })

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: recipient.email,
        subject,
        html,
      })
      if (error) {
        // Fallback for primary errors
        const { data: fbData, error: fbError } = await resend.emails.send({
          from: fallbackFromAddress,
          to: recipient.email,
          subject,
          html,
        })
        if (fbError) {
          return {
            to: recipient.email,
            success: false,
            fromUsed: 'fallback',
            error: normalizeResendError(fbError),
            errorRaw: safeStringify(fbError),
          }
        }
        return { to: recipient.email, success: true, id: fbData?.id, fromUsed: 'fallback' }
      }
      return { to: recipient.email, success: true, id: data?.id, fromUsed: 'primary' }
    } catch (err: unknown) {
      // Fallback attempt on unexpected errors
      try {
        const { data: fbData, error: fbError } = await resend.emails.send({
          from: fallbackFromAddress,
          to: recipient.email,
          subject,
          html,
        })
        if (fbError) {
          return {
            to: recipient.email,
            success: false,
            fromUsed: 'fallback',
            error: `${normalizeResendError(err)}; fallback: ${normalizeResendError(fbError)}`,
          }
        }
        return { to: recipient.email, success: true, id: fbData?.id, fromUsed: 'fallback' }
      } catch (fallbackErr: unknown) {
        return {
          to: recipient.email,
          success: false,
          fromUsed: 'fallback',
          error: `${normalizeResendError(err)}; fallback: ${normalizeResendError(fallbackErr)}`,
        }
      }
    }
  })

  const results = await Promise.all(sendPromises)
  const failed = results.filter((r) => !r.success)
  const succeeded = results.filter((r) => r.success)

  return {
    success: failed.length === 0,
    summary: { total: results.length, succeeded: succeeded.length, failed: failed.length },
    results,
  }
}

function safeStringify(input: unknown): string {
  try {
    if (input instanceof Error) {
      const base = { name: input.name, message: input.message, stack: input.stack }
      return JSON.stringify(base)
    }
    return typeof input === 'string' ? input : JSON.stringify(input)
  } catch {
    try {
      return String(input)
    } catch {
      return '[unserializable error]'
    }
  }
}

function normalizeResendError(input: unknown): string {
  if (input instanceof Error) {
    return input.message || input.name
  }
  try {
    const obj = typeof input === 'string' ? { message: input } : (input as Record<string, unknown>)
    const msg = (obj && (obj.message as string)) || (obj && (obj['error'] as string))
    return msg || safeStringify(obj)
  } catch {
    return String(input)
  }
}


