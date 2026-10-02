import { PrismaClient } from '@prisma/client';
import type { AnonymousBallotSubmission, ElectionProtocolConfig, ProofVerifier } from './protocol';
import { validateBallotSubmission, UnconfiguredProofVerifier, ciphertextHash } from './protocol';
export * from './protocol';
export const db = new PrismaClient();
export type ElectionInput = { title: string; description?: string; startAt: Date; endAt: Date; chainId: number };
export type ElectionService = { create(input: ElectionInput): Promise<unknown>; list(): Promise<unknown[]> };
export const electionService: ElectionService = {
  create: input => db.election.create({ data: input, include: { candidates: true } }),
  list: () => db.election.findMany({ include: { candidates: true }, orderBy: { createdAt: 'desc' } }),
};

export async function issueCredential(input: {
  voterId: string;
  electionId: string;
  commitment: string;
  expiresAt?: Date;
}) {
  if (!input.voterId || !input.electionId || !/^0x[0-9a-fA-F]{64}$/.test(input.commitment)) {
    throw new Error('invalid credential issuance');
  }
  return db.anonymousCredential.upsert({
    where: { voterId_electionId: { voterId: input.voterId, electionId: input.electionId } },
    create: { voterId: input.voterId, electionId: input.electionId, credentialCommitment: input.commitment, expiresAt: input.expiresAt, status: 'ACTIVE' },
    update: { credentialCommitment: input.commitment, status: 'ACTIVE', revokedAt: null, revocationReason: null, consumedAt: null },
  });
}

export async function revokeCredential(id: string, reason?: string) {
  return db.anonymousCredential.update({
    where: { id },
    data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: reason },
  });
}

export async function configureElectionProtocol(input: ElectionProtocolConfig) {
  return db.election.update({
    where: { id: input.electionId },
    data: { membershipGroupId: input.membershipGroupId, membershipRoot: input.membershipRoot, proofVerifierVersion: input.proofVerifierVersion, ballotEncryptionKey: input.ballotEncryptionKey },
  });
}

export async function submitAnonymousBallot(input: AnonymousBallotSubmission, verifier: ProofVerifier = new UnconfiguredProofVerifier()) {
  validateBallotSubmission(input);
  const election = await db.election.findUnique({ where: { id: input.electionId } });
  if (!election || election.status !== 'LIVE' || election.membershipRoot !== input.membershipRoot) throw new Error('election is not accepting this root');
  if (!(await verifier.verify({ proof: input.proof, root: input.membershipRoot, nullifier: input.nullifier, signal: input.signal }))) throw new Error('invalid proof');
  try {
    return await db.anonymousBallot.create({
      data: { electionId: input.electionId, nullifier: input.nullifier, ballotCommitment: input.ballotCommitment, ciphertextHash: await ciphertextHash(input.ciphertext), proof: input.proof },
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') throw new Error('nullifier already used');
    throw error;
  }
}

/** Boundary for an out-of-band provider; never put ballot plaintext in notifications. */
export interface NotificationProvider {
  send(input: { recipient: string; template: string; payload?: Record<string, unknown> }): Promise<void>;
}
export const notificationProvider: NotificationProvider = {
  async send() { /* connect email/webhook provider in the deployment runtime */ },
};

export async function recordAudit(input: { action: string; entityType: string; entityId?: string; electionId?: string; actorId?: string; metadata?: Record<string, unknown> }) {
  return db.auditLog.create({ data: input as Parameters<typeof db.auditLog.create>[0]['data'] });
}
export async function disconnect(){ await db.$disconnect(); }
