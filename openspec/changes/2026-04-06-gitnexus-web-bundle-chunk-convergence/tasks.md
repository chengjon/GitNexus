## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the gitnexus-web bundle-chunk convergence slice
- [x] 1.2 Bound the slice to bundle/runtime boundaries rather than user-visible behavior changes

## 2. Browser Bundle Convergence

- [x] 2.1 Add a shared syntax-highlighter helper using light Prism registrations
- [x] 2.2 Update markdown and code-reference rendering to use the shared light highlighter
- [x] 2.3 Convert Mermaid rendering surfaces to runtime lazy loading

## 3. Build And Worker Chunk Convergence

- [x] 3.1 Add a shared Vite chunking helper for app and worker builds
- [x] 3.2 Apply the shared chunking rules to both `vite.config.ts` and `vite.inline.config.mjs`
- [x] 3.3 Split worker LLM / embedding / parser / graph / zip stacks into dedicated chunks
- [x] 3.4 Split browser framework runtime out of the main app entry chunk

## 4. Validation And Audit

- [x] 4.1 Add a regression test for the chunking helper
- [x] 4.2 Run the targeted Vitest chunking regression
- [x] 4.3 Run `npm run build`
- [x] 4.4 Record before/after artifact sizes and remaining warnings in the audit trail
- [x] 4.5 Validate the new OpenSpec change
