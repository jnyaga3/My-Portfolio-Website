import { PrismaClient } from '@prisma/client';
import type { AnonymousBallotSubmission, ElectionProtocolConfig, ProofVerifier } from './protocol';
export * from './protocol';
export declare const db: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export type ElectionInput = {
    title: string;
    description?: string;
    startAt: Date;
    endAt: Date;
    chainId: number;
};
export type ElectionService = {
    create(input: ElectionInput): Promise<unknown>;
    list(): Promise<unknown[]>;
};
export declare const electionService: ElectionService;
export declare function issueCredential(input: {
    voterId: string;
    electionId: string;
    commitment: string;
    expiresAt?: Date;
}): Promise<{
    id: string;
    status: import("@prisma/client").$Enums.CredentialStatus;
    credentialCommitment: string;
    voterId: string;
    electionId: string;
    issuedAt: Date;
    consumedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    revocationReason: string | null;
}>;
export declare function revokeCredential(id: string, reason?: string): Promise<{
    id: string;
    status: import("@prisma/client").$Enums.CredentialStatus;
    credentialCommitment: string;
    voterId: string;
    electionId: string;
    issuedAt: Date;
    consumedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    revocationReason: string | null;
}>;
export declare function configureElectionProtocol(input: ElectionProtocolConfig): Promise<{
    membershipRoot: string | null;
    id: string;
    title: string;
    description: string | null;
    contractAddress: string | null;
    chainId: number;
    membershipGroupId: string | null;
    proofVerifierVersion: string;
    ballotEncryptionKey: string | null;
    startAt: Date;
    endAt: Date;
    status: import("@prisma/client").$Enums.ElectionStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function submitAnonymousBallot(input: AnonymousBallotSubmission, verifier?: ProofVerifier): Promise<{
    nullifier: string;
    ballotCommitment: string;
    id: string;
    electionId: string;
    ciphertextHash: string;
    proof: string;
    txHash: string | null;
    submittedAt: Date;
}>;
/** Boundary for an out-of-band provider; never put ballot plaintext in notifications. */
export interface NotificationProvider {
    send(input: {
        recipient: string;
        template: string;
        payload?: Record<string, unknown>;
    }): Promise<void>;
}
export declare const notificationProvider: NotificationProvider;
export declare function recordAudit(input: {
    action: string;
    entityType: string;
    entityId?: string;
    electionId?: string;
    actorId?: string;
    metadata?: Record<string, unknown>;
}): Promise<{
    id: string;
    createdAt: Date;
    electionId: string | null;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
}>;
export declare function disconnect(): Promise<void>;
