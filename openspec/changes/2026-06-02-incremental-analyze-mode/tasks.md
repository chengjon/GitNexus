## 1. Design

- [ ] 1.1 Define the file discovery interface for scoped modes
- [ ] 1.2 Design the large-file skip cache (path, TTL, invalidation)
- [ ] 1.3 Design the "already current" fast-path check

## 2. Implementation

- [ ] 2.1 Add `--staged-only` flag: resolve staged files via
      `git diff --cached --name-only`, pass to analyzer
- [ ] 2.2 Add `--changed-only` flag: resolve changed files via
      `git diff --name-only`, pass to analyzer
- [ ] 2.3 Add `--files <path...>` flag: accept explicit file list
- [ ] 2.4 Cache large-file skip scan results in `.gitnexus/cache/`
- [ ] 2.5 Implement "index already current" fast path: compare requested
      file set against current index, skip if all present and unchanged
- [ ] 2.6 Suppress "Skipped N large files" repeat output when using cached
      skip scan (show only on first run or when changed)

## 3. CLI Integration

- [ ] 3.1 Register new flags in CLI parser
- [ ] 3.2 Update `gitnexus analyze --help` output
- [ ] 3.3 Update CLAUDE.md and skill docs with new flag usage

## 4. Testing

- [ ] 4.1 Test `--staged-only` with 3 staged SCSS files — only those indexed
- [ ] 4.2 Test `--changed-only` after edit — only changed files indexed
- [ ] 4.3 Test `--files` with explicit paths — only those indexed
- [ ] 4.4 Test fast-path: second run with same files returns "already current"
- [ ] 4.5 Test: full analyze still works when no flags are provided
- [ ] 4.6 Test: large-file cache invalidated on new analyze with different max-file-size

## 5. Verification

- [ ] 5.1 Benchmark: `--staged-only` for 5 staged SCSS files should complete
      in <10 seconds (vs 60-125s full scan)
- [ ] 5.2 Verify `detect_changes` after scoped analyze returns correct results
