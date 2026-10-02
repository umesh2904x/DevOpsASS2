# Git Workflow - Branching Strategy

## Branches

| Branch | Purpose | Deployed? | Protected? |
|--------|---------|-----------|------------|
| `main` | Production code, always releasable | Yes, on tag | Yes - no direct push |
| `develop` | Integration branch for the current sprint | No | Yes - PR + review required |
| `feature/US-xx-description` | One branch per user story | No | No |
| `bugfix/US-xx-description` | One branch per defect | No | No |
| `hotfix/<issue>` | Urgent production fix | Yes | No, PR still required |

## Flow

```
main        A---B---C---D---E        (tagged v1.0.0, v1.0.1)
          /         ^         ^
develop   A---B---C---D---E---
        /   \     /   \     /
feature  F1--F2--M1   F3--M2      (M = merge commit from PR)
```

1. `git checkout develop && git pull`
2. `git checkout -b feature/US-04-place-order`
3. Commit in small logical chunks with meaningful messages
4. Push and open a pull request targeting `develop`
5. `ci.yml` must be green and a review is required before merge
6. Merge with **Squash and merge**
7. When the sprint is done and `develop` is stable:
   `git checkout main && git merge develop && git tag v1.0.0 && git push --tags`
8. `cd.yml` deploys automatically because of the tag

## Commit Message Convention

```
<type>(<scope>): <short description>

type:  feat | fix | test | docs | refactor | chore | ci
scope: the module or user story id
```

Examples:

```
feat(US-04): add order placement with stock validation
fix(US-05): reset lastLatencyMs on every response
test(US-02): cover 404 branch for unknown book id
ci: cache docker layers with gha backend
chore: bump express to 4.21.2
```

## Pull Request Checklist

- [ ] Branch name references a user story
- [ ] PR description says which stories it closes
- [ ] `ci.yml` shows all checks passed
- [ ] At least one approving review
- [ ] No merge conflicts with `develop`
- [ ] Screenshots attached if the change is visible in the UI

## Release Tagging

```bash
git checkout main
git pull
git merge --no-ff develop -m "release: v1.0.0"
git tag -a v1.0.0 -m "Sprint 1 release"
git push origin main
git push --tags
```

Tags are the **only** thing that triggers production deployment, which makes
releases explicit and repeatable.

## Evidence Commands

```bash
git branch -a                       # all branches
git log --oneline --graph --all -20 # branch graph
git tag -l                          # release tags
git log --format='%h %an %ad %s' --date=short -10
git shortlog -sn                    # contribution per author
```
