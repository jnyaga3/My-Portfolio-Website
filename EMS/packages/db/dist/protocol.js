"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullifierRegistry = exports.UnconfiguredProofVerifier = void 0;
exports.validateHex = validateHex;
exports.validateBallotSubmission = validateBallotSubmission;
exports.ciphertextHash = ciphertextHash;
/** The adapter fails closed until a reviewed Semaphore verifier is installed. */
class UnconfiguredProofVerifier {
    async verify() {
        return false;
    }
}
exports.UnconfiguredProofVerifier = UnconfiguredProofVerifier;
/** Useful for deterministic pre-flight checks; persistence remains authoritative. */
class NullifierRegistry {
    seen = new Set();
    add(nullifier) {
        if (this.seen.has(nullifier))
            return false;
        this.seen.add(nullifier);
        return true;
    }
}
exports.NullifierRegistry = NullifierRegistry;
function validateHex(value, field) {
    if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error(`${field} must be a 32-byte hex value`);
    }
}
function validateBallotSubmission(input) {
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
async function ciphertextHash(ciphertext) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(ciphertext));
    return `0x${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
