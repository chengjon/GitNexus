## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the `gitnexus-web` worker runtime lazy-loading slice
- [x] 1.2 Bound the slice to worker runtime loading behavior rather than API changes

## 2. Runtime Boundary Convergence

- [x] 2.1 Add cached dynamic loaders for embedding runtime modules in `ingestion.worker.ts`
- [x] 2.2 Add cached dynamic loaders for agent/context/message runtime modules in `ingestion.worker.ts`
- [x] 2.3 Route worker embedding, chat, and enrichment methods through the lazy loaders without changing the public worker API

## 3. Regression Coverage

- [x] 3.1 Add a worker lazy-import boundary regression test
- [x] 3.2 Verify the new test fails before implementation and passes after implementation

## 4. Validation And Audit

- [x] 4.1 Run the targeted Vitest worker-boundary regression
- [x] 4.2 Run `npm run build`
- [x] 4.3 Validate the new OpenSpec change
- [x] 4.4 Update the technical-debt roadmap with the new worker-runtime convergence status
