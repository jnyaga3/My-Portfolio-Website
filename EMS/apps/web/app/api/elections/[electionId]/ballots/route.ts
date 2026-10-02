import { NextResponse } from 'next/server';
import { submitAnonymousBallot } from '@ems/db';
import type { AnonymousBallotSubmission } from '@ems/db';
import { getEnv } from '../../../../../lib/env';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { electionId: string } }) {
  try {
    getEnv();
    const body = await request.json() as Omit<AnonymousBallotSubmission, 'electionId'>;
    const ballot = await submitAnonymousBallot({ ...body, electionId: params.electionId });
    return NextResponse.json({ data: { id: ballot.id, submittedAt: ballot.submittedAt } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit ballot';
    return NextResponse.json({ error: message }, { status: message.includes('already used') ? 409 : 400 });
  }
}
