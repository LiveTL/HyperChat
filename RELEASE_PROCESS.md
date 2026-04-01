# HyperChat Release Process

This repo ships from two branches and they are not versioned the same way.

## Branch Order

1. Make and validate changes on `mv2` first.
2. Commit and push on `mv2`.
3. Merge `mv2` into `mv3`.
4. Validate and push `mv3`.
5. Create releases from each branch.

If the same task also affects LiveTL, do not begin in LiveTL. Finish this HyperChat ladder first, then bump the LiveTL submodule chain in this order:

1. LiveTL `develop`
2. LiveTL `mv3-fr`
3. LiveTL `release`

HyperChat is the upstream source for shared chat behavior. LiveTL is downstream packaging/integration work after that.

## Local Validation

On `mv2`:

```bash
git checkout mv2
yarn
yarn build
yarn package
```

On `mv3`:

```bash
git checkout mv3
yarn
yarn build:chrome
yarn build:firefox
yarn package
```

Reinstall after switching branches. Dependency trees and lockfiles differ enough that stale installs can break builds.

## Release Behavior By Branch

### `mv2`

- Workflow: `.github/workflows/release.yml`
- Trigger: GitHub release event `released`
- Build command uses inline env injection: `VERSION=<tag> yarn build`
- Result: release tag version is injected into the built manifest at build time.

Practical rule for `mv2`: create a release tag like `v69.43.0` and the workflow builds that version.

### `mv3`

- Workflow: `.github/workflows/release.yml`
- Trigger: GitHub release event `published`
- The workflow computes `VERSION`, but current build commands do not pass/export it to `yarn build:*`.
- Result: build version comes from repository version state unless workflow is changed.

Practical rule for `mv3`: bump the repo version (`package.json`/manifest version source), commit it, then create the release tag.

## Recommended "Least Surprise" Publish Flow

1. Finish feature/fix on `mv2`, run local build/package checks, push.
2. Merge to `mv3`, run local build/package checks, push.
3. Create `mv2` release tag and publish release.
4. Bump version state on `mv3` (if needed), then create/publish `mv3` release tag.
5. Confirm both artifacts exist on each GitHub release:
   - `HyperChat-Chrome.zip`
   - `HyperChat-Firefox.zip`

## Notes For LiveTL Sync

LiveTL consumes HyperChat via submodules. Keep HyperChat changes branch-aligned (`mv2` and `mv3`) so LiveTL can take them with straightforward submodule bumps in its release flow.
