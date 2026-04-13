## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for stale Ralph cleanup command
- [x] 1.2 Bound the slice to command design, implementation evidence, and
  upstream replay guidance

## 2. Design Record

- [x] 2.1 Record the recommended command as `omx cancel ralph --stale`
- [x] 2.2 Record stale-detection safety rules and refusal cases

## 3. Planning Record

- [x] 3.1 Write an implementation plan for the command
- [x] 3.2 Record execution-time verification expectations

## 4. Implementation Evidence

- [x] 4.1 Record the locally installed OMX package files modified for the fix
- [x] 4.2 Record the focused compiled test evidence
- [x] 4.3 Record live workspace command and stop-hook verification evidence

## 5. Upstream Replay Guidance

- [x] 5.1 Add a note describing how to replay the verified local fix into the
  canonical `oh-my-codex` source repository
- [x] 5.2 Record the follow-up root-fallback edge case and its upstream/source
  replay status
- [x] 5.3 Record commit-hygiene warnings and a concrete rewrite recipe for the
  local upstream replay commits

## 6. Finalization

- [x] 6.1 Validate the new OpenSpec change
- [x] 6.2 Re-run scoped change detection for final review

## 7. Final Verification Notes

- `openspec validate 2026-04-12-omx-stale-ralph-cancel`
  returned `Change '2026-04-12-omx-stale-ralph-cancel' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=1`, `changed_symbols=2`,
  `affected_processes=0`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`
- scoped `git status --short` still shows the new docs / OpenSpec files as
  untracked repository records, while the only tracked code diff remains the
  pre-existing local test change
- follow-up source replay in `/tmp/oh-my-codex-upstream` passed
  `npm run build` plus
  `node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js`
  with `76/76` passing
- follow-up installed-package verification passed
  `node --test /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js`
  with `62/62` passing
- clean upstream replay branch is `stale-ralph-clean-pr-v2` with commits
  `1193124` and `bf1b47d`
- upstream PR `Yeachan-Heo/oh-my-codex#1505` was closed by the owner because
  repository changes must target `dev`, not `main`
- the later dev-targeted follow-up PR `Yeachan-Heo/oh-my-codex#1509` was
  closed by the owner at `2026-04-12T15:45:57Z`
- the `dev`-base PR carried four commits at close: `e8c9244`, `6897673`,
  `7707816`, and `0022b24`
- the later review follow-up on `#1509` added a regression for the mixed
  session/root skill-state shape and re-ran
  `npm run build` plus
  `node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js`
  with `84/84` passing
- a later Codex review comment on `#1509` flagged one more Windows-path-on-
  POSIX edge case, and that follow-up now remains at the verified fork-only
  stop point `46622fa`
- the post-close verified fork-only stop point replied on the closed PR
  discussion and re-ran
  `npm run build` plus
  `node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js`
  with `85/85` passing
- the owner closure note said the lifecycle / termination contract change was
  too broad to merge as-is and would need a narrower maintainer-led pass
- as of `2026-04-13`, fresh upstream `gh pr list` / `gh issue list` checks
  still show no new maintainer-led follow-up PR, issue, or branch for this
  narrower stale-cleanup contract
- later live workspace re-verification in `/opt/claude/GitNexus` again passed
  `omx cancel ralph --stale`, terminalized the root compatibility Ralph state,
  cleared the matching root `skill-active-state`, and a fresh Stop-hook replay
  returned `outputJson: null`
- a fresh later local replay again found root `.omx/state/ralph-state.json`
  stuck at `active: true` / `current_phase: "starting"`; rerunning
  `omx cancel ralph --stale` again cleared the root compatibility state, wrote
  `completed_at: "2026-04-12T16:04:28.274Z"`, reduced root
  `skill-active-state.json` to `active: false`, and left `omx status` at
  `ralph: inactive (phase: cancelled)`
- later repository record commits captured the follow-up audit, audits index
  sync, commit-hygiene warning, rewrite recipe, OpenSpec hygiene sync, PR
  closure tracking, fresh post-closure replay evidence, April 13 upstream
  absence checks, and the final audits index wording cleanup:
  `0970f5a`, `c3dadd1`, `cac14ea`, `ca75770`, `f8529a7`, `f3f924b`,
  `94b7989`, `8de89e8`, `10b905c`, `019d5bc`, `d466926`, `d16d9b2`,
  `75b372d`
- after those record-only follow-ups, scoped `git status --short` again reduced
  to the same single pre-existing user modification:
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
