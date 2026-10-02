import { strict as assert } from 'node:assert';
import test from 'node:test';
import { NullifierRegistry, validateBallotSubmission } from './protocol';

const root = `0x${'a'.repeat(64)}` as `0x${string}`;
const valid = { electionId: 'election', nullifier: `0x${'1'.repeat(64)}` as `0x${string}`, ballotCommitment: `0x${'2'.repeat(64)}` as `0x${string}`, ciphertext: 'encrypted', proof: 'proof', membershipRoot: root, signal: 'election:candidate' };

test('ballot validation is deterministic', () => {
  assert.doesNotThrow(() => validateBallotSubmission(valid));
  assert.throws(() => validateBallotSubmission({ ...valid, nullifier: '0x00' as `0x${string}` }), /nullifier/);
});

test('duplicate nullifiers are rejected', () => {
  const registry = new NullifierRegistry();
  assert.equal(registry.add(valid.nullifier), true);
  assert.equal(registry.add(valid.nullifier), false);
});
