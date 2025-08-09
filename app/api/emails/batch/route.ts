import { renderMinimalEmail } from '@/lib/email/templates/minimalist';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

type Recipient = {
  email: string;
  username: string;
};

type RequestBody = {
  title: string;
  body: string;
  recipients: Recipient[];
};

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as Partial<RequestBody>
    const recipients: Recipient[] = Array.isArray(json?.recipients) ? json!.recipients as Recipient[] : []
    const fromAddress: string = process.env.RESEND_FROM_EMAIL ?? '興大學伴酷系統 <nchuetutor@nflincu.com>'
    const fallbackFromAddress: string = process.env.RESEND_FALLBACK_FROM_EMAIL ?? '興大學伴酷系統 <onboarding@resend.dev>'

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      )
    }

    if (!json?.title || !json?.body) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients must be a non-empty array' },
        { status: 400 }
      )
    }

    // Basic email validation
    const invalidEmails = recipients
      .map((r) => r.email)
      .filter((email) => !/^\S+@\S+\.\S+$/.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid recipient emails: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    const subject = json.title

    // Send in parallel but limit to reasonable chunk size if needed
    const sendPromises = recipients.map(async (recipient) => {
      const html = renderMinimalEmail({
        username: recipient.username,
        title: json.title!,
        body: json.body!,
      })

      // Attempt with fixed domain first
      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: recipient.email,
          subject,
          html,
        })
        if (error) {
          // Always try fallback for primary errors (common case: unverified domain)
          const fallbackFrom = fallbackFromAddress
          const { data: fbData, error: fbError } = await resend.emails.send({
            from: fallbackFrom,
            to: recipient.email,
            subject,
            html,
          })
          if (fbError) {
            const fbMsg = normalizeResendError(fbError)
            const fbRaw = safeStringify(fbError)
            return { to: recipient.email, success: false, fromUsed: 'fallback', error: fbMsg, errorRaw: fbRaw }
          }
          return { to: recipient.email, success: true, id: fbData?.id, fromUsed: 'fallback' }
        }
        return { to: recipient.email, success: true, id: data?.id, fromUsed: 'primary' }
      } catch (err: unknown) {
        const message = normalizeResendError(err)
        // Fallback attempt on unexpected errors
        try {
          const fallbackFrom = fallbackFromAddress
          const { data: fbData, error: fbError } = await resend.emails.send({
            from: fallbackFrom,
            to: recipient.email,
            subject,
            html,
          })
          if (fbError) {
            const fbMsg = normalizeResendError(fbError)
            return { to: recipient.email, success: false, fromUsed: 'fallback', error: `${message}; fallback: ${fbMsg}` }
          }
          return { to: recipient.email, success: true, id: fbData?.id, fromUsed: 'fallback' }
        } catch (fallbackErr: unknown) {
          const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error (fallback)'
          return { to: recipient.email, success: false, fromUsed: 'fallback', error: `${message}; fallback: ${fbMsg}` }
        }
      }
    })

    const results = await Promise.all(sendPromises)

    const failed = results.filter((r) => !r.success)
    const succeeded = results.filter((r) => r.success)

    return NextResponse.json({
      success: failed.length === 0,
      summary: {
        total: results.length,
        succeeded: succeeded.length,
        failed: failed.length,
      },
      results,
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
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


