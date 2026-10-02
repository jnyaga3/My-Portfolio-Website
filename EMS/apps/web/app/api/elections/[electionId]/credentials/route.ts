import { NextResponse } from 'next/server';
import { db, issueCredential, revokeCredential } from '@ems/db';
import { getEnv } from '../../../../../lib/env';

export const runtime = 'nodejs';

function authorized(request: Request) {
  const env = getEnv();
  return !env.adminApiKey || request.headers.get('x-admin-api-key') === env.adminApiKey;
}

export async function POST(request: Request, { params }: { params: { electionId: string } }) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    const body = await request.json() as { walletAddress?: unknown; commitment?: unknown; expiresAt?: unknown };
    if (typeof body.walletAddress !== 'string' || typeof body.commitment !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(body.commitment)) {
      return NextResponse.json({ error: 'walletAddress and 32-byte commitment are required' }, { status: 400 });
    }
    const voter = await db.voter.upsert({ where: { walletAddress: body.walletAddress }, create: { walletAddress: body.walletAddress, verified: true }, update: { verified: true } });
    const credential = await issueCredential({ voterId: voter.id, electionId: params.electionId, commitment: body.commitment, expiresAt: typeof body.expiresAt === 'string' ? new Date(body.expiresAt) : undefined });
    return NextResponse.json({ data: { id: credential.id, commitment: credential.credentialCommitment, status: credential.status } }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Unable to issue credential' }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: { electionId: string } }) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    const body = await request.json() as { credentialId?: unknown; reason?: unknown };
    if (typeof body.credentialId !== 'string') return NextResponse.json({ error: 'credentialId is required' }, { status: 400 });
    const credential = await db.anonymousCredential.findFirst({ where: { id: body.credentialId, electionId: params.electionId } });
    if (!credential) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    await revokeCredential(credential.id, typeof body.reason === 'string' ? body.reason : undefined);
    return NextResponse.json({ data: { id: credential.id, status: 'REVOKED' } });
  } catch { return NextResponse.json({ error: 'Unable to revoke credential' }, { status: 400 }); }
}
