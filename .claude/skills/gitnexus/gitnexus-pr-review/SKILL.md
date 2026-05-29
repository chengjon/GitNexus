---
name: gitnexus-pr-review
description: "Use when the user wants to review a pull request, understand what a PR changes, assess risk of merging, or check for missing test coverage. Examples: \"Review this PR\", \"What does PR #42 change?\", \"Is this PR safe to merge?\""
---

<!-- gitnexus:keep -->

# PR Review with GitNexus

## When to Use

- "Review this PR"
- "What does PR #42 change?"
- "Is this safe to merge?"
- "What's the blast radius of this PR?"
- "Are there missing tests for this PR?"
- Reviewing someone else's code changes before merge

## Workflow

```
1. gh pr diff <number>                                    → Get the raw diff
2. gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "<repo-name>"})  → Map diff to affected flows
3. In multi-repo MCP sessions, pass `repo` explicitly; in worktrees, also pass `cwd` and check `path_resolution`
4. For each changed symbol:
   gitnexus_impact({target: "<symbol>", direction: "upstream"})    → Blast radius per change
5. gitnexus_context({name: "<key symbol>"})               → Understand callers/callees
6. READ gitnexus://repo/{name}/processes                   → Check affected execution flows
7. Summarize findings with risk assessment
```

> If "Index is stale" → run `npx gitnexus analyze` in terminal before reviewing.

## Checklist

```
- [ ] Fetch PR diff (gh pr diff or git diff base...head)
- [ ] Read the PR governance fields first: Line Scope, Workline Lane, Scope Deviations, Current Source of Truth
- [ ] gitnexus_detect_changes to map changes to affected execution flows
- [ ] In multi-repo MCP sessions, pass `repo` explicitly
- [ ] In worktrees, also pass `cwd` if the MCP server may not be in the PR worktree, then check `path_resolution`
- [ ] gitnexus_impact on each non-trivial changed symbol
- [ ] Review d=1 items (WILL BREAK) — are callers updated?
- [ ] gitnexus_context on key changed symbols to understand full picture
- [ ] Check if affected processes have test coverage
- [ ] Cross-check Validation notes: Execution Path Verification, Regression Coverage, Current Docs / Facts Updated
- [ ] Assess overall risk level
- [ ] Write review summary with findings
```

## PR Governance Read

Review these fields before reading the diff in detail:

- `Line Scope` tells you the intended slice boundary. Flag unrelated governance churn, side quests, or opportunistic refactors that leak past it.
- `Workline Lane` should be exactly one of `feature`, `governance`, or `refactor`. Mixed intent in one PR is a risk signal unless the secondary change is strictly required.
- `Scope Deviations` should disclose any unavoidable cross-domain compatibility change instead of hiding it in the patch.
- `Current Source of Truth` should start with `OpenSpec` when the PR changes capability or architecture behavior, then name any current repo entrypoint docs updated in the same line.
- `Execution Path Verification` should prove the changed runtime, CLI, API, or user-facing path was actually exercised.
- `Regression Coverage` should show which unit tests, feature tests, or focused scripts were added or rerun to guard the change.
- `Current Docs / Facts Updated` should tell you whether current source-of-truth docs changed with the behavior, boundary, enablement condition, or known limitation.

## Review Dimensions

| Dimension | How GitNexus Helps |
| --- | --- |
| **Correctness** | `context` shows callers — are they all compatible with the change? |
| **Blast radius** | `impact` shows d=1/d=2/d=3 dependents — anything missed? |
| **Completeness** | `detect_changes` shows all affected flows — are they all handled? |
| **Test coverage** | `impact({includeTests: true})` shows which tests touch changed code |
| **Breaking changes** | d=1 upstream items that aren't updated in the PR = potential breakage |
| **Path verification** | `detect_changes` output's `git_diff_path` and `path_resolution` confirm correct analysis path |

## Risk Assessment

| Signal | Risk |
| --- | --- |
| Changes touch <3 symbols, 0-1 processes | LOW |
| Changes touch 3-10 symbols, 2-5 processes | MEDIUM |
| Changes touch >10 symbols or many processes | HIGH |
| Changes touch auth, payments, or data integrity code | CRITICAL |
| d=1 callers exist outside the PR diff | Potential breakage — flag it |

## Tools

**gitnexus_detect_changes** — map PR diff to affected execution flows:

In multi-repo MCP sessions, pass `repo` explicitly. In worktrees, also pass
`cwd` if the MCP server may not be in the PR worktree, then verify
`git_diff_path` and `path_resolution`.

```
gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "<repo-name>"})

→ Changed: 8 symbols in 4 files
→ Affected processes: CheckoutFlow, RefundFlow, WebhookHandler
→ Risk: MEDIUM
```

Worktree example:

```
gitnexus_detect_changes({
  scope: "compare",
  base_ref: "main",
  repo: "<repo-name>",
  cwd: "/path/to/repo/.worktrees/pr-42"
})
```

**gitnexus_impact** — blast radius per changed symbol:

```
gitnexus_impact({target: "validatePayment", direction: "upstream"})

→ d=1 (WILL BREAK):
  - processCheckout (src/checkout.ts:42) [CALLS, 100%]
  - webhookHandler (src/webhooks.ts:15) [CALLS, 100%]

→ d=2 (LIKELY AFFECTED):
  - checkoutRouter (src/routes/checkout.ts:22) [CALLS, 95%]
```

**gitnexus_impact with tests** — check test coverage:

```
gitnexus_impact({target: "validatePayment", direction: "upstream", includeTests: true})

→ Tests that cover this symbol:
  - validatePayment.test.ts [direct]
  - checkout.integration.test.ts [via processCheckout]
```

**gitnexus_context** — understand a changed symbol's role:

```
gitnexus_context({name: "validatePayment"})

→ Incoming calls: processCheckout, webhookHandler
→ Outgoing calls: verifyCard, fetchRates
→ Processes: CheckoutFlow (step 3/7), RefundFlow (step 1/5)
```

## Example: "Review PR #42"

```
1. gh pr diff 42 > /tmp/pr42.diff
   → 4 files changed: payments.ts, checkout.ts, types.ts, utils.ts

2. gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "<repo-name>", cwd: "/path/to/repo/.worktrees/pr-42"})
   → Changed symbols: validatePayment, PaymentInput, formatAmount
   → Affected processes: CheckoutFlow, RefundFlow
   → Risk: MEDIUM

3. gitnexus_impact({target: "validatePayment", direction: "upstream"})
   → d=1: processCheckout, webhookHandler (WILL BREAK)
   → webhookHandler is NOT in the PR diff — potential breakage!

4. gitnexus_impact({target: "PaymentInput", direction: "upstream"})
   → d=1: validatePayment (in PR), createPayment (NOT in PR)
   → createPayment uses the old PaymentInput shape — breaking change!

5. gitnexus_context({name: "formatAmount"})
   → Called by 12 functions — but change is backwards-compatible (added optional param)

6. Review summary:
   - MEDIUM risk — 3 changed symbols affect 2 execution flows
   - BUG: webhookHandler calls validatePayment but isn't updated for new signature
   - BUG: createPayment depends on PaymentInput type which changed
   - OK: formatAmount change is backwards-compatible
   - Tests: checkout.test.ts covers processCheckout path, but no webhook test
```

## Review Output Format

Structure your review as:

```markdown
## PR Review: <title>

**Risk: LOW / MEDIUM / HIGH / CRITICAL**

### Changes Summary
- <N> symbols changed across <M> files
- <P> execution flows affected

### Findings
1. **[severity]** Description of finding
   - Evidence from GitNexus tools
   - Affected callers/flows

### Missing Coverage
- Callers not updated in PR: ...
- Untested flows: ...

### Recommendation
APPROVE / REQUEST CHANGES / NEEDS DISCUSSION
```
