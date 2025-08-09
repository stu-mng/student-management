import type { ErrorResponse } from '@/app/api/types';
import { createClient } from '@/database/supabase/server';
import { sendBatchEmails } from '@/lib/email/send-batch';
import { hasManagerPermission } from '@/lib/utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// Resend is used inside lib/email/send-batch

type Recipient = {
  email: string;
  username: string;
};

type RequestBody = {
  title: string;
  body: string;
  recipients: Recipient[];
};


export async function POST(request: NextRequest) {
  try {
    // Authn & role check (manager or higher)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        role:roles(
          id,
          name,
          display_name,
          color,
          order
        )
      `)
      .eq('id', user.id)
      .single();
    if (userError) {
      return NextResponse.json<ErrorResponse>({ error: userError.message }, { status: 500 });
    }
    const rawRole = (userData as { role?: { name: string; order?: number } | { name: string; order?: number }[] }).role;
    const userRole = (rawRole ?? null) as { name: string; order?: number } | null;
    if (!hasManagerPermission(userRole)) {
      return NextResponse.json<ErrorResponse>({ error: 'Permission denied' }, { status: 403 });
    }

    const json = (await request.json()) as Partial<RequestBody>
    const recipients = Array.isArray(json?.recipients) ? (json!.recipients as { email: string; username: string }[]) : []

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json<ErrorResponse>({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
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

    const result = await sendBatchEmails({ title: json.title!, body: json.body!, recipients })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}