Deploy Countrivo to Vercel production.

1. Run `npm run build` — abort if it fails.
2. Run `npx tsc --noEmit` — abort if type errors.
3. Run `git status` — warn if there are uncommitted changes.
4. Run `vercel --prod --yes` to deploy to production.
5. After deploy, verify: `curl -s -o /dev/null -w "%{http_code}" https://countrivo.com`
6. Report the deployment URL and HTTP status.
