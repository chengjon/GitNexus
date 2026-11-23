/**
 * Child process for the detect-changes CLI watchdog test.
 *
 * Spawned as `node --import <tsx> --import detect-changes-stderr-hooks.mjs
 * detect-changes-cli-child.ts <scope>` with DETECT_CHANGES_REPO pointing at a
 * temp git checkout. Unlike detect-changes-stderr-child.ts (which calls
 * LocalBackend directly), this child goes through `detectChangesCommand` —
 * the CLI entry that owns the startup anchor line and the watchdog — with the
 * same module hooks stubbing LBUG and the repo registry.
 */
import { detectChangesCommand } from '../../src/cli/tool.js';

const scope = process.argv[2];

if (!scope) {
  process.stderr.write('usage: detect-changes-cli-child.ts <scope>\n');
  process.exit(2);
}

// The command on an empty diff finishes in a few milliseconds. Keep the event
// loop alive for a fixed window after the command starts so the armed sampler
// deterministically ticks at least once mid-run (this is exactly how a real
// runaway gets detected: the alarm fires while the command runs, not after).
const command = detectChangesCommand({ scope, repo: 'autocrlf-repo' });
await new Promise((resolve) => setTimeout(resolve, 100));
await command;
