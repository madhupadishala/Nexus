# Nexus Platform

Modular, secure, regulator-aware pharmacovigilance platform.

## Architecture

```
apps/
  api/          # Unified API gateway (Fastify)
  web/          # React frontend (shadcn/ui + IBM Carbon patterns)
  worker/       # Background jobs (screening scheduler, submissions)

packages/
  core/                 # Shared constants, types, utilities
  auth/                 # Identity, tenancy, entitlements, RBAC
  audit/                # Immutable audit log, evidence chain, Merkle
  events/               # Event bus, contracts, outbox pattern
  agent-runtime/        # BaseAgent, Router, PoolManager, ModelGateway, Checkpointing
  agents/               # 37+ agent implementations (clean, one file each)
  adapters/             # Adapter contracts + implementations
  submissions/          # E2B R3 generator, FDA/EGS, EMA/EVHUMAN, PMDA gateways
  regulatory-knowledge/ # Corpus loader, chunking, embeddings, retrieval, versioning
  ui-core/              # Design system tokens, primitives (Radix/shadcn), Carbon patterns
  testing/              # Eval harness, golden test utils, Warpath fixtures, canaries
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local infrastructure (Postgres, Redis, Kafka, MinIO, Qdrant, OpenSearch)
pnpm docker:up

# Run API in development mode
cd apps/api && pnpm dev

# API available at http://localhost:3000
# Health check: curl http://localhost:3000/health
```

## Modules

| Module | Description | Status |
|--------|-------------|--------|
| Literature Screening | Article screening for ICSR relevance | 🚧 Week 1 |
| Intake & Triage | Case intake, triage, drug extraction, reporter ID, clock start | ⏳ Week 2 |
| Case Processing | Causality, listedness, country, safety detection, medical review | ⏳ Week 3 |
| Submissions | Narrative generation, E2B R3, FDA/EGS, EMA/EVHUMAN, PMDA gateways | ⏳ Week 4 |
| Signal Management | Signal detection, evaluation, recommendation | ⏳ Week 6 |
| Aggregate Reporting | PSUR/PBRER, DSUR, RMP | ⏳ Week 6 |
| PV Documentation | SOPs, work instructions, regulatory correspondence | ⏳ Week 6 |

## Gates (Every Friday Release)

1. **Karpathy** - Understand before editing, smallest correct change
2. **Ponytail** - Remove accidental complexity, no unjustified abstractions
3. **Architecture Guardian** - Preserve canonical boundaries
4. **Warpath** - Complete real workflows, close edge cases
5. **CodeRabbit** - Independent code review
6. **Hacker** - Adversarial security testing
7. **Evidence** - Traceability: Requirement → Architecture → Code → Test → Security → Evidence → Release
8. **Regulatory Knowledge** - Trace to authoritative sources
9. **Modular Benchmark** - Benchmarked vs Argus, Veeva, LifeSphere, Ennov
10. **Product Design Guardian** - Enterprise UI standards (IBM Carbon, PatternFly, Radix, shadcn/ui)
