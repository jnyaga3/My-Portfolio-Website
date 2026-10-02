import { NextResponse } from 'next/server';
import { electionService } from '@ems/db';
import { getEnv } from '../../../lib/env';
export const runtime = 'nodejs';
export async function GET() {
  try { getEnv(); const data = await electionService.list(); return NextResponse.json({ data, meta: { total: data.length } }); }
  catch { return NextResponse.json({ error: 'Service unavailable' }, { status: 503 }); }
}
export async function POST(request: Request) {
  let env: ReturnType<typeof getEnv>;
  try { env = getEnv(); } catch { return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 }); }
  if (env.adminApiKey && request.headers.get('x-admin-api-key') !== env.adminApiKey) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }
  let body: { title?: unknown; description?: unknown; startAt?: unknown; endAt?: unknown; chainId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200 ||
      typeof body.startAt !== 'string' || typeof body.endAt !== 'string') {
    return NextResponse.json({ error: 'title, startAt and endAt are required' }, { status: 400 });
  }

  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt || endAt <= new Date()) {
    return NextResponse.json({ error: 'endAt must be a valid future date after startAt' }, { status: 400 });
  }

  const chainId = body.chainId === undefined ? 31337 : Number(body.chainId);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    return NextResponse.json({ error: 'chainId must be a positive integer' }, { status: 400 });
  }

  try {
    const data = await electionService.create({
      title: body.title.trim(),
      description: typeof body.description === 'string' ? body.description.trim() || undefined : undefined,
      startAt,
      endAt,
      chainId,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Unable to create election' }, { status: 500 }); }
}
