# Branch protection

Run once after the first push to `main`, from a machine with the GitHub CLI
authenticated as the repo owner (requires admin on the repo):

```bash
gh api "repos/heet2107/WebHeroAI/branches/main/protection" -X PUT --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, typecheck, test, build", "Dependency vulnerability scan"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Notes:

- **Required approving reviews is 0** deliberately: a solo founder cannot
  approve their own pull request. The rule that matters is that CI must pass
  before merge. Raise the count when a second maintainer joins.
- `strict: true` requires branches to be up to date with `main` before merging.
- The two contexts are the job **names** from `.github/workflows/ci.yml`. If a
  job is renamed there, rename it here.
- The contexts only become selectable/enforced after they have run at least
  once, so push the first PR before or immediately after running this.

Equivalent web UI path: repo → Settings → Branches → Add branch ruleset →
target `main`, enable "Require status checks to pass" (select both CI jobs,
plus "Require branches to be up to date"), "Require a pull request before
merging" with 0 approvals, and "Block force pushes".
