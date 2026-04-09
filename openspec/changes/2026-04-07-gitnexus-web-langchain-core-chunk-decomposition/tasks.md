## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the `gitnexus-web` LangChain core chunk decomposition slice
- [x] 1.2 Bound the slice to worker chunk routing rather than runtime behavior changes

## 2. Worker Chunk Investigation

- [x] 2.1 Add regression coverage for representative LangChain worker chunk routing
- [x] 2.2 Try finer `@langchain/core/dist/*` worker chunk groups and capture the build result
- [x] 2.3 Try splitting `langsmith/` and prompt-related subtrees into dedicated chunks and capture the build result
- [x] 2.4 Revert to the last stable `worker-langchain-core` boundary after both experiments introduced circular chunk warnings

## 3. Validation And Audit

- [x] 3.1 Run the targeted chunking regression
- [x] 3.2 Run `npm run build`
- [x] 3.3 Validate the new OpenSpec change
- [x] 3.4 Record the reverted stable boundary and rejected decomposition evidence
