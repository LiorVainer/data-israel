import { defineHooks } from '@timoaus/define-claude-code-hooks';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export default defineHooks({
  PreToolUse: [
    // [1] Block .env file access (read + write)
    {
      matcher: 'Read|Edit|Write',
      handler: async (input) => {
        const filePath = (input.tool_input.file_path ?? '') as string;
        if (!filePath) return;
        const ALLOWLIST = ['.env.example', '.env.sample', '.env.template', '.env.schema'];
        if (ALLOWLIST.some((a) => filePath.endsWith(a))) return;
        if (/\.env($|\.)/.test(filePath)) {
          return {
            decision: 'block' as const,
            reason:
              'Blocked: .env files contain secrets (OPENROUTER_API_KEY, CLERK_SECRET_KEY, etc.). Edit manually if needed.',
          };
        }
      },
    },
    // [2+3+4] Block .env bash access + destructive commands + enforce pnpm
    {
      matcher: 'Bash',
      handler: async (input) => {
        const cmd = (input.tool_input.command as string) ?? '';
        const cmdLower = cmd.toLowerCase();

        // .env access patterns
        const envPatterns = [
          /cat\s+\.env/,
          /head\s+\.env/,
          /tail\s+\.env/,
          /less\s+\.env/,
          /more\s+\.env/,
          /source\s+\.env/,
          /\.\s+\.env/,
          /echo\s+\$.*key/i,
          /echo\s+\$.*secret/i,
          /echo\s+\$.*token/i,
          /\bprintenv\b/,
          /^env\s*$/,
          /base64\s+\.env/,
          /curl.*\.env/,
          /scp.*\.env/,
          /wget.*\.env/,
          /grep\s+-r\s+(password|secret|token|key)/,
        ];
        for (const p of envPatterns) {
          if (p.test(cmdLower)) {
            return {
              decision: 'block' as const,
              reason: 'Blocked: This command may expose secrets from .env files.',
            };
          }
        }

        // Destructive commands
        const destructive = [
          {
            p: /git\s+push\s+.*--force|git\s+push\s+-f/,
            r: 'Blocked: Force push is dangerous. Use regular push.',
          },
          {
            p: /git\s+reset\s+--hard/,
            r: 'Blocked: git reset --hard destroys uncommitted work.',
          },
          {
            p: /git\s+checkout\s+\.\s*$/,
            r: 'Blocked: git checkout . discards all changes.',
          },
          {
            p: /git\s+clean\s+-f/,
            r: 'Blocked: git clean -f deletes untracked files permanently.',
          },
          {
            p: /rm\s+-rf\s+[/~*.]/,
            r: 'Blocked: Destructive rm -rf pattern detected.',
          },
          {
            p: /drop\s+(table|database)/i,
            r: 'Blocked: DROP TABLE/DATABASE is destructive.',
          },
          { p: /mkfs/, r: 'Blocked: mkfs formats disks.' },
        ];
        for (const { p, r } of destructive) {
          if (p.test(cmdLower)) return { decision: 'block' as const, reason: r };
        }

        // Enforce pnpm
        if (
          /\b(npm\s+(install|add|ci|remove|uninstall|i)\b|yarn\s+(add|install|remove)\b)/.test(
            cmdLower
          )
        ) {
          return {
            decision: 'block' as const,
            reason: 'Use pnpm, not npm/yarn. This project uses pnpm exclusively.',
          };
        }
      },
    },
    // [5] Block lock file & node_modules edits
    {
      matcher: 'Edit|Write',
      handler: async (input) => {
        const filePath = (input.tool_input.file_path as string) ?? '';
        if (/node_modules[/\\]/.test(filePath)) {
          return {
            decision: 'block' as const,
            reason: 'Blocked: Do not edit node_modules/ directly.',
          };
        }
        if (/pnpm-lock\.yaml|package-lock\.json|yarn\.lock/.test(filePath)) {
          return {
            decision: 'block' as const,
            reason: 'Blocked: Lock files should not be hand-edited. Use pnpm add/remove.',
          };
        }
      },
    },
    // [6] Block hardcoded secrets in code
    {
      matcher: 'Edit|Write',
      handler: async (input) => {
        const content =
          ((input.tool_input.new_string ?? input.tool_input.content) as string) ?? '';
        const secretPatterns = [
          /sk-or-[a-zA-Z0-9]{20,}/,
          /sk_live_[a-zA-Z0-9]{20,}/,
          /pk_live_[a-zA-Z0-9]{20,}/,
          /whsec_[a-zA-Z0-9]{20,}/,
          /AKIA[A-Z0-9]{16}/,
          /ghp_[a-zA-Z0-9]{36}/,
        ];
        for (const p of secretPatterns) {
          if (p.test(content)) {
            return {
              decision: 'block' as const,
              reason:
                'Blocked: Detected hardcoded secret/API key. Use environment variables instead.',
            };
          }
        }
      },
    },
  ],

  PostToolUse: [
    // [7] ESLint --fix on changed file
    {
      matcher: 'Edit|Write',
      handler: async (input) => {
        const filePath = (input.tool_input.file_path ?? '') as string;
        if (filePath && /\.(ts|tsx)$/.test(filePath)) {
          try {
            execSync(`npx eslint --fix "${filePath}"`, {
              timeout: 15000,
              stdio: 'ignore',
            });
          } catch {
            /* non-blocking */
          }
        }

        // [11a] Track openspec changes for Notion sync
        if (filePath && /openspec\/changes\//.test(filePath)) {
          const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
          const pendingPath = join(projectDir, '.claude', 'notion-pending.json');
          const match = filePath.match(/openspec\/changes\/([^/]+)\//);
          if (match) {
            const changeId = match[1];
            let pending: { updates: string[]; creates: string[] } = {
              updates: [],
              creates: [],
            };
            try {
              if (existsSync(pendingPath)) {
                pending = JSON.parse(readFileSync(pendingPath, 'utf-8'));
              }
            } catch { /* fresh start */ }

            const isTaskFile = filePath.endsWith('tasks.md');
            const isProposal = filePath.endsWith('proposal.md');

            if (isTaskFile && !pending.updates.includes(changeId)) {
              pending.updates.push(changeId);
            }
            if (isProposal && !pending.creates.includes(changeId)) {
              pending.creates.push(changeId);
            }

            try {
              writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
            } catch { /* non-blocking */ }
          }
        }
      },
    },
  ],

  Notification: [
    // [8] Windows BurntToast notification
    async (input) => {
      const msg = (input as { message?: string }).message ?? 'Claude needs your attention';
      const truncated = msg.length > 100 ? msg.slice(0, 100) + '...' : msg;
      const escaped = truncated.replace(/'/g, "''");
      try {
        execSync(
          `powershell.exe -Command "New-BurntToastNotification -Text 'Claude Code', '${escaped}'"`,
          { timeout: 5000, stdio: 'ignore' }
        );
      } catch {
        /* non-blocking */
      }
    },
  ],

  Stop: [
    // [10] Quality gate: tsc + vibecheck + tests
    async (input) => {
      if ((input as { stop_hook_active?: boolean }).stop_hook_active) return;

      const failures: string[] = [];

      try {
        execSync('npx tsc --noEmit', { timeout: 30000, stdio: 'pipe' });
      } catch (e: unknown) {
        const err = e as { stdout?: Buffer };
        const output = err.stdout?.toString().slice(0, 400) ?? 'tsc failed';
        failures.push(`[tsc] ${output}`);
      }

      try {
        execSync('npm run vibecheck 2>&1', { timeout: 30000, stdio: 'pipe', shell: 'bash' });
      } catch (e: unknown) {
        const err = e as { status?: number; stdout?: Buffer; stderr?: Buffer };
        if (err.status && err.status > 0) {
          const output =
            err.stderr?.toString().slice(0, 400) ||
            err.stdout?.toString().slice(0, 400) ||
            'vibecheck failed';
          failures.push(`[vibecheck] ${output}`);
        }
      }

      try {
        execSync('npx vitest run --dir src', {
          timeout: 60000,
          stdio: 'pipe',
          shell: 'bash',
        });
      } catch (e: unknown) {
        const err = e as { status?: number; stdout?: Buffer; stderr?: Buffer };
        if (err.status && err.status > 0) {
          const output =
            err.stdout?.toString().slice(0, 400) ||
            err.stderr?.toString().slice(0, 400) ||
            'tests failed';
          failures.push(`[tests] ${output}`);
        }
      }

      if (failures.length > 0) {
        return {
          decision: 'block' as const,
          reason: `Quality gate failed. Fix before stopping:\n\n${failures.join('\n\n')}`,
        };
      }

      // [11] OpenSpec Notion sync reminder
      // Check if a .claude/notion-pending file exists — written by openspec hooks
      const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
      const pendingPath = join(projectDir, '.claude', 'notion-pending.json');
      if (existsSync(pendingPath)) {
        try {
          const pending = JSON.parse(readFileSync(pendingPath, 'utf-8')) as {
            updates?: string[];
            creates?: string[];
          };
          const reminders: string[] = [];

          if (pending.updates?.length) {
            reminders.push(
              `[Notion Sync] Update these in Notion (notion-update-page): ${pending.updates.join(', ')}. ` +
                'Match by Change ID in "OpenSpec Changes" database. Update checklists and Status.'
            );
          }
          if (pending.creates?.length) {
            reminders.push(
              `[Notion Sync] Create these in Notion (notion-create-pages): ${pending.creates.join(', ')}. ` +
                'Set: Name, Change ID, Category, Priority, Status (To Do). ' +
                'Parent: Data Israel (31d6dd80-0603-81c9-8114-c4444cd24106).'
            );
          }

          if (reminders.length > 0) {
            return {
              decision: 'block' as const,
              reason: `Notion sync required before stopping:\n\n${reminders.join('\n\n')}\n\nAfter syncing, delete .claude/notion-pending.json to pass this gate.`,
            };
          }
        } catch { /* malformed file — skip */ }
      }
    },
  ],
});
