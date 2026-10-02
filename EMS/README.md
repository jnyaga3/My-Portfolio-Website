# CivicChain EMS

Production-oriented foundation for transparent blockchain-backed elections. The monorepo contains a polished Next.js administrator dashboard, an auditable Solidity election contract, and a Prisma/PostgreSQL persistence boundary. The protocol boundary models trusted eligibility issuance/revocation and anonymous ballots using a Semaphore-style group root, proof, and one-time nullifier.

## Quick start

```bash
corepack enable && pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter @ems/db generate
pnpm --filter @ems/contracts build
pnpm dev
```

Open http://localhost:3000. Deploy locally with `pnpm --filter @ems/contracts deploy:local` after starting a local node. Never store voter identity data on-chain: the contract records one-way ballot hashes and vote totals; Prisma stores operational records and transaction references.

## Packages
- `apps/web`: responsive admin overview UI and design foundation.
- `packages/contracts`: Solidity `Election` contract, Hardhat config and deployment script.
- `packages/db`: Prisma schema and typed services for elections, trusted eligibility credentials, revocation, anonymous ballots (nullifier/commitment/ciphertext hash/proof), audit logs, notifications, and immutable vote references.

## Security and operations
Use a multisig owner for production deployments, enforce wallet/signature verification in the API, validate eligibility before submitting transactions, and monitor emitted events against the indexer. Configure a managed PostgreSQL and an RPC provider via environment variables.

The protocol is **not cryptographically complete** until a reviewed Semaphore-compatible library is installed and wired to `ProofVerifier`; the default adapter fails closed. Administrators are trusted to verify eligibility and authenticate issuance/revocation. Identity is stored only with credentials and is never linked to `AnonymousBallot`; voters must encrypt plaintext client-side. Decryption keys require threshold/multisig custody, rotation, access logs, and an independently reproducible tally. Pin and audit group roots, circuit/verifier versions, proof parameters, and contract events per election. Never place identity or plaintext on-chain.

Protocol API: `POST /api/elections/:id/credentials` (admin key; issue or rotate a
commitment), `DELETE` on the same route (revoke), and
`POST /api/elections/:id/ballots` (anonymous proof, nullifier, commitment, and
client-encrypted ciphertext). Duplicate nullifiers return `409`. The ballot
service rejects submissions while the verifier adapter is unconfigured.

## Staging deployment

1. Provision PostgreSQL and an RPC endpoint; copy `.env.example` to `.env` and set a strong
   `DATABASE_URL`, `ADMIN_API_KEY`, `NEXT_PUBLIC_CHAIN_ID`, and `NEXT_PUBLIC_RPC_URL`.
2. Run `corepack enable && pnpm install --no-frozen-lockfile`, then
   `pnpm --filter @ems/db generate` and apply schema changes with
   `pnpm --filter @ems/db migrate` (use reviewed migrations in CI/production).
3. Build and run `pnpm --filter web build && pnpm --filter web start`, or build the
   supplied `Dockerfile` and expose port 3000. Check `/api/health` before traffic.
4. Send `x-admin-api-key` for election-management writes. Put TLS, rate limiting,
   secret rotation, backups, monitoring, and an external indexer in front of the app.

This is staging infrastructure, not a production election certification. Unresolved
requirements include integrating and auditing a real Semaphore prover/verifier and ballot encryption implementation, independent smart-contract and application audits, formal threat
modeling, verified voter eligibility and identity controls, a complete ZK credential
protocol, key custody/cryptographic ballot design, coercion resistance, disaster
recovery drills, accessibility review, legal/regulatory approval, and an independently
verifiable tally. Do not use for a real election until these are delivered.
