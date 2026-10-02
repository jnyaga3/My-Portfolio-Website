import { NextResponse } from 'next/server';
import { db } from '@ems/db';
import { getEnv } from '../../../lib/env';

export const runtime = 'nodejs';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    getEnv();
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'ok', checkedAt });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unavailable', checkedAt }, { status: 503 });
  }
}
