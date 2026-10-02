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
export class UnconfiguredProofVerifier implements ProofVerifier {
  async verify(): Promise<boolean> {
    return false;
  }
}

/** Useful for deterministic pre-flight checks; persistence remains authoritative. */
export class NullifierRegistry {
  private readonly seen = new Set<Hex>();
  add(nullifier: Hex): boolean {
    if (this.seen.has(nullifier)) return false;
    this.seen.add(nullifier);
    return true;
  }
}

export function validateHex(value: unknown, field: string): asserts value is Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${field} must be a 32-byte hex value`);
  }
}

export function validateBallotSubmission(input: AnonymousBallotSubmission): void {
  if (!input.electionId || !input.membershipRoot || !input.signal || !input.proof || !input.ciphertext) {
    throw new Error('electionId, membershipRoot, signal, proof and ciphertext are required');
  }
  validateHex(input.nullifier, 'nullifier');
  validateHex(input.ballotCommitment, 'ballotCommitment');
  validateHex(input.membershipRoot, 'membershipRoot');
  if (input.ciphertext.length > 1_000_000 || input.proof.length > 100_000) {
    throw new Error('ballot payload is too large');
  }
}

/** Public metadata only; plaintext is encrypted by the voter before submission. */
export async function ciphertextHash(ciphertext: string): Promise<Hex> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(ciphertext));
  return `0x${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
