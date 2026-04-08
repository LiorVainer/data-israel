## 1. Bright Data account setup (outside repo, operator action)

- [x] 1.1 Sign in to brightdata.com and create a **Residential** zone with country filter `Israel (IL)`, pay-as-you-go.
- [x] 1.2 From the zone's **Access parameters** tab, copy the generated proxy URL of the shape `http://brd-customer-<id>-zone-<zone>-country-il:<password>@brd.superproxy.io:33335`. URL-encode the password if it contains `@`, `:`, `#`, `/`, or `?`.
- [x] 1.3 Paste the URL into `.env.local` as `BRIGHT_DATA_PROXY_URL=...`.

## 2. Dependencies and shared helper

- [x] 2.1 Use axios's native `proxy` field — no new runtime dependency. (Earlier attempt with `https-proxy-agent@^9` broke the Turbopack client bundle because it transitively imports `net`/`tls`; reverted in follow-up commit.)
- [x] 2.2 Create `src/lib/proxy/bright-data.ts` exporting `getBrightDataProxyConfig()` AND `getBrightDataUnlockerProxyConfig()`, both returning `AxiosProxyConfig | false`. Behavior: each returns `false` when its env var is unset or empty; otherwise parses the URL with the isomorphic `URL` API and caches the resulting `AxiosProxyConfig` at module scope. Caches are independent per helper.
- [x] 2.3 Add JSDoc documenting: (a) only Knesset/Shufersal/Rami Levy may use the helpers; (b) pass directly to axios's `proxy:` field (do NOT combine with `httpsAgent`/`httpAgent`); (c) URL-encoding rule for the password; (d) why `https-proxy-agent` is intentionally not used; (e) which zone each data source uses (Knesset/Shufersal → residential; Rami Levy → unlocker with residential fallback).
- [x] 2.4 Document BOTH `BRIGHT_DATA_PROXY_URL` and `BRIGHT_DATA_UNLOCKER_URL` in `.env.example` with placeholders, URL-encoding notes, and a comment explaining which zone each data source uses.

## 3. Wire proxy into each problematic client

- [x] 3.1 Edit `src/data-sources/knesset/api/knesset.client.ts`: import `getBrightDataProxyConfig`, set `proxy: getBrightDataProxyConfig()` on the existing `axios.create()` options. Do not change timeouts, headers, retry logic, or rate limiting.
- [x] 3.2 Edit `src/data-sources/shufersal/api/shufersal.client.ts`: same pattern as Knesset.
- [x] 3.3 Edit `src/data-sources/rami-levy/api/rami-levy.client.ts`: import BOTH helpers, prefer the unlocker with a residential fallback — `const proxy = unlocker !== false ? unlocker : residential;` — then set `proxy:` on `axios.create()`. Keep the browser-like headers (Origin, Referer, User-Agent, Accept-Language) so that if the unlocker forwards them verbatim, the origin's secondary checks also pass.
- [x] 3.4 Verify no other data-source client (`cbs`, `datagov`, `budget`, `govmap`, `drugs`, `health`) imports either proxy helper — grep to confirm.

## 4. Next.js verification route

- [x] 4.1 Create `src/app/api/debug/bright-data/route.ts` as an App Router route handler (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`). Mirror the style of `src/app/api/debug/upstream-probe/route.ts`.
- [x] 4.2 The handler runs FIVE checks in parallel: (a) `geo.brdtest.com/welcome.txt` through the RESIDENTIAL proxy — record country/city/IP/ASN so operators can verify the residential pool; (b) `geo.brdtest.com/welcome.txt` through the UNLOCKER proxy — same metadata so operators can confirm they're reaching a different pool; (c) `knessetApi.searchBills('חוק', undefined, 1)`; (d) `shufersalApi.searchProducts('חלב', 1)`; (e) `ramiLevyApi.searchProducts('חלב', undefined, 1)` (rami-levy uses whichever proxy is wired per its client — i.e., unlocker when set).
- [x] 4.3 Response JSON: `{ probedAt, environment, zones: { residentialConfigured, unlockerConfigured }, allPassed, checks: [{ id, ok, durationMs, summary, error? }] }`. Return `Cache-Control: no-store`. `allPassed` treats an unset zone as "passed" (not a failure) so the route is useful in either single-zone or dual-zone configurations.
- [x] 4.4 Add a header comment marking the file as temporary — remove after rollout is verified.
- [ ] 4.5 Run `npm run dev`, hit `http://localhost:3000/api/debug/bright-data`, confirm `geo.brdtest.com` reports country `IL` and the three client checks all succeed.

## 5. Quality gates (repo-wide)

- [x] 5.1 `tsc --noEmit` passes with zero new errors.
- [x] 5.2 `npm run lint` passes.
- [ ] 5.3 `npm run vibecheck` maintains the existing score (≥93/100).
- [ ] 5.4 `npm run build` succeeds.

## 6. Preview deploy and verification

- [ ] 6.1 Add `BRIGHT_DATA_PROXY_URL` to Vercel **Preview** environment via `vercel env add` or dashboard.
- [ ] 6.2 Push the branch, open a PR, wait for the preview deployment.
- [ ] 6.3 On the preview URL, send one chat message that triggers each of Knesset, Shufersal, and Rami Levy agents. Confirm real data is returned (not empty, not an HTML error page).
- [ ] 6.4 Check Vercel function logs for errors on the three client modules; confirm no increased error rate on the other six data sources.

## 7. Production rollout

- [ ] 7.1 Add `BRIGHT_DATA_PROXY_URL` to Vercel **Production** environment.
- [ ] 7.2 Merge the PR.
- [ ] 7.3 After deploy, repeat the three-query verification on the production URL.
- [ ] 7.4 Monitor Bright Data dashboard for 48 h: confirm usage is under 100 MB (anything higher indicates a bug).
- [ ] 7.5 Update the **Notion "OpenSpec Changes"** page for this change: set `Status` to `Done` and `Completed Date` to today.

## 8. Rollback plan (reference only — do not execute unless needed)

- [ ] 8.1 If the proxy causes regressions, delete `BRIGHT_DATA_PROXY_URL` from Vercel Production and redeploy. Code falls back to direct egress.
- [ ] 8.2 If the direct egress is also broken (Knesset/Shufersal/Rami Levy remain geo-blocked), `git revert` the three client commits from section 3 to restore the pre-change behavior.

## 9. Cleanup

- [ ] 9.1 After rollout is verified in Production, delete `src/app/api/debug/bright-data/route.ts`. The verification route is temporary by design.
