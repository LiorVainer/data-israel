/**
 * InstructionsLoaded hook — standalone shim.
 *
 * Fires every time a CLAUDE.md or .claude/rules/*.md file loads into context.
 * Appends a structured JSON line to .claude/rules.log so we can verify that
 * path-scoped rules trigger on the correct files.
 *
 * This lives outside hooks.ts because @timoaus/define-claude-code-hooks
 * doesn't yet type the InstructionsLoaded event in its HookDefinition.
 * Using a standalone script avoids an `as any` cast on the defineHooks call.
 *
 * Wired in .claude/settings.json as a direct command (not via the
 * __run_hook dispatcher).
 *
 * Input (stdin, JSON):
 *   - file_path:         which CLAUDE.md / rule file loaded
 *   - load_reason:       session_start | path_glob_match | nested_traversal | include
 *   - globs:             path patterns that triggered loading (for path-scoped rules)
 *   - trigger_file_path: which file Claude was reading when the rule loaded
 */
import { appendFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

interface InstructionsLoadedInput {
  hook_event_name?: string;
  file_path?: string;
  load_reason?: string;
  globs?: string[];
  trigger_file_path?: string;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

async function main(): Promise<void> {
  const raw = await readStdin();
  let input: InstructionsLoadedInput = {};
  try {
    input = JSON.parse(raw) as InstructionsLoadedInput;
  } catch {
    // Malformed JSON — still exit 0 so we never block Claude.
    process.exit(0);
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const logPath = join(projectDir, '.claude', 'rules.log');

  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      file_path: input.file_path,
      load_reason: input.load_reason,
      globs: input.globs,
      trigger_file_path: input.trigger_file_path,
    }) + '\n';

  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, line);
  } catch {
    // Non-blocking — never fail the hook even if the log can't be written.
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
