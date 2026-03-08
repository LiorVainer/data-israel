## 1. Create `src/` and move application directories
- [x] 1.1 Create `src/` directory
- [x] 1.2 `git mv app src/app`
- [x] 1.3 `git mv components src/components`
- [x] 1.4 `git mv hooks src/hooks`
- [x] 1.5 `git mv lib src/lib`
- [x] 1.6 `git mv agents src/agents`
- [x] 1.7 `git mv services src/services`
- [x] 1.8 `git mv context src/context`
- [x] 1.9 `git mv constants src/constants`
- [x] 1.10 `git mv types src/types`
- [x] 1.11 `git mv scripts src/scripts`
- [x] 1.12 `git mv proxy.ts src/proxy.ts`
- [x] 1.13 `git mv instrumentation.ts src/instrumentation.ts`
- [x] 1.14 Update `src/instrumentation.ts` relative imports: `./sentry.server.config` → `../sentry.server.config`, `./sentry.edge.config` → `../sentry.edge.config`

## 2. Update configuration files
- [x] 2.1 Update `tsconfig.json`: change `"@/*": ["./*"]` to `"@/*": ["./src/*"]`
- [x] 2.2 Update `vitest.config.ts`: change alias `'@': path.resolve(__dirname, '.')` to `'@': path.resolve(__dirname, 'src')`
- [x] 2.3 Update `vitest.eval.config.ts`: same alias change as 2.2
- [x] 2.4 Update `components.json`: change `"css": "app/globals.css"` to `"css": "src/app/globals.css"`
- [x] 2.5 Update `package.json` scripts: update paths referencing `agents/evals/` to `src/agents/evals/`
- [x] 2.6 Update `tsconfig.json` `include` array: verified existing globs already match `src/`
- [x] 2.7 Add `@/convex/*` → `./convex/*` alias to tsconfig.json (convex stays at root, needs separate mapping)
- [x] 2.8 Add `@/convex` alias to vitest.config.ts and vitest.eval.config.ts

## 3. Update documentation
- [x] 3.1 Update `CLAUDE.md`: all directory structure references to reflect `src/` layout
- [x] 3.2 Update `openspec/project.md`: update project structure and file references

## 4. Verify
- [x] 4.1 Run `npm run build` — succeeds
- [x] 4.2 Run `npm run eslint` — 0 errors (warnings are pre-existing)
- [x] 4.3 Run `tsc` — 1 pre-existing error (not migration-related)
- [x] 4.4 Run `npm run vibecheck` — passes
- [x] 4.5 Run `npm run test` — 4 files, 20 tests pass
- [x] 4.6 Verify `@/*` imports resolve correctly — build + tsc confirm all imports work
