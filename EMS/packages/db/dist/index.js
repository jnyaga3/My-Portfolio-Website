"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationProvider = exports.electionService = exports.db = void 0;
exports.issueCredential = issueCredential;
exports.revokeCredential = revokeCredential;
exports.configureElectionProtocol = configureElectionProtocol;
exports.submitAnonymousBallot = submitAnonymousBallot;
exports.recordAudit = recordAudit;
exports.disconnect = disconnect;
const client_1 = require("@prisma/client");
const protocol_1 = require("./protocol");
__exportStar(require("./protocol"), exports);
exports.db = new client_1.PrismaClient();
exports.electionService = {
    create: input => exports.db.election.create({ data: input, include: { candidates: true } }),
    list: () => exports.db.election.findMany({ include: { candidates: true }, orderBy: { createdAt: 'desc' } }),
};
async function issueCredential(input) {
    if (!input.voterId || !input.electionId || !/^0x[0-9a-fA-F]{64}$/.test(input.commitment)) {
        throw new Error('invalid credential issuance');
    }
    return exports.db.anonymousCredential.upsert({
        where: { voterId_electionId: { voterId: input.voterId, electionId: input.electionId } },
        create: { voterId: input.voterId, electionId: input.electionId, credentialCommitment: input.commitment, expiresAt: input.expiresAt, status: 'ACTIVE' },
        update: { credentialCommitment: input.commitment, status: 'ACTIVE', revokedAt: null, revocationReason: null, consumedAt: null },
    });
}
async function revokeCredential(id, reason) {
    return exports.db.anonymousCredential.update({
        where: { id },
        data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: reason },
    });
}
async function configureElectionProtocol(input) {
    return exports.db.election.update({
        where: { id: input.electionId },
        data: { membershipGroupId: input.membershipGroupId, membershipRoot: input.membershipRoot, proofVerifierVersion: input.proofVerifierVersion, ballotEncryptionKey: input.ballotEncryptionKey },
    });
}
async function submitAnonymousBallot(input, verifier = new protocol_1.UnconfiguredProofVerifier()) {
    (0, protocol_1.validateBallotSubmission)(input);
    const election = await exports.db.election.findUnique({ where: { id: input.electionId } });
    if (!election || election.status !== 'LIVE' || election.membershipRoot !== input.membershipRoot)
        throw new Error('election is not accepting this root');
    if (!(await verifier.verify({ proof: input.proof, root: input.membershipRoot, nullifier: input.nullifier, signal: input.signal })))
        throw new Error('invalid proof');
    try {
        return await exports.db.anonymousBallot.create({
            data: { electionId: input.electionId, nullifier: input.nullifier, ballotCommitment: input.ballotCommitment, ciphertextHash: await (0, protocol_1.ciphertextHash)(input.ciphertext), proof: input.proof },
        });
    }
    catch (error) {
        if (error.code === 'P2002')
            throw new Error('nullifier already used');
        throw error;
    }
}
exports.notificationProvider = {
    async send() { },
};
async function recordAudit(input) {
    return exports.db.auditLog.create({ data: input });
}
async function disconnect() { await exports.db.$disconnect(); }
