export interface MinimalEmailProps {
  username: string
  title: string
  body: string
}

/**
 * Minimalist HTML email template used by batch email sender.
 * Contains:
 *  - Greeting: `${username} 您好`
 *  - Wishes: `祝身體健康`
 *  - Origin: `興大學伴酷系統`
 */
export function renderMinimalEmail({ username, title, body }: MinimalEmailProps): string {
  const safeTitle = escapeHtml(title)
  const safeUsername = escapeHtml(username)
  const safeBody = body
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px 0; line-height:1.6;">${linkify(line)}</p>`) // preserve basic paragraphs and auto-link URLs
    .join('')
  const domainUrl = normalizeDomainUrl(process.env.NEXT_PUBLIC_APP_DOMAIN)

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    /* Minimal, email-safe styles */
    body { margin: 0; padding: 0; background-color: #f6f7f9; }
    .container { max-width: 560px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 2px rgba(16,24,40,0.06); border: 1px solid #eaecf0; }
    .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
             color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0; }
    .greeting { color: #111827; font-size: 16px; margin: 12px 0 16px 0; }
    .content { color: #374151; font-size: 14px; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  </style>
  <!--[if mso]>
  <style>
    .card { border: 1px solid #eaecf0; }
  </style>
  <![endif]-->
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1 class="title">${safeTitle}</h1>
        <div class="greeting">${safeUsername} 您好，</div>
        <div class="content">${safeBody}</div>
        <div class="footer">
          <div>祝身體健康</div>
          <div style="margin-top: 6px;">興大學伴酷系統</div>
          ${domainUrl ? `<div style="margin-top: 6px;"><a href="${domainUrl}" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration:none;">${escapeHtml(displayDomain(domainUrl))}</a></div>` : ''}
        </div>
      </div>
    </div>
  </body>
</html>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Convert URLs in plain text into anchor tags while escaping non-link parts
function linkify(input: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(input)) !== null) {
    const [url] = match
    const start = match.index
    // Escape text before the URL
    result += escapeHtml(input.slice(lastIndex, start))
    const safeUrl = escapeHtml(url)
    result += `<a href="${safeUrl}" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration:none;">${safeUrl}</a>`
    lastIndex = start + url.length
  }
  // Escape the remaining text
  result += escapeHtml(input.slice(lastIndex))
  return result
}

function normalizeDomainUrl(input?: string): string | null {
  if (!input) return null
  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  try {
    const u = new URL(url)
    return u.toString()
  } catch {
    return null
  }
}

function displayDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.host
  } catch {
    return url
  }
}


