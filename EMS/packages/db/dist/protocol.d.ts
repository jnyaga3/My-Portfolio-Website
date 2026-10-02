export type Hex = `0x${string}`;
export interface ElectionProtocolConfig {
    electionId: string;
    membershipGroupId: string;
    membershipRoot: Hex;
    proofVerifierVersion: string;
    ballotEncryptionKey: string;
}
export interface EligibilityCredential {
    commitment: Hex;
    electionId: string;
    issuedAt: Date;
    expiresAt?: Date;
}
export interface AnonymousBallotSubmission {
    electionId: string;
    nullifier: Hex;
    ballotCommitment: Hex;
    ciphertext: string;
    proof: string;
    membershipRoot: Hex;
    signal: string;
}
export interface ProofVerifier {
    verify(input: {
        proof: string;
        root: Hex;
        nullifier: Hex;
        signal: string;
    }): Promise<boolean>;
}
/** The adapter fails closed until a reviewed Semaphore verifier is installed. */
export declare class UnconfiguredProofVerifier implements ProofVerifier {
    verify(): Promise<boolean>;
}
/** Useful for deterministic pre-flight checks; persistence remains authoritative. */
export declare class NullifierRegistry {
    private readonly seen;
    add(nullifier: Hex): boolean;
}
export declare function validateHex(value: unknown, field: string): asserts value is Hex;
export declare function validateBallotSubmission(input: AnonymousBallotSubmission): void;
/** Public metadata only; plaintext is encrypted by the voter before submission. */
export declare function ciphertextHash(ciphertext: string): Promise<Hex>;
