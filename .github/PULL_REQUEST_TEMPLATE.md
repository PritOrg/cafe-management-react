## What & why

<!-- Describe the change and the problem it solves. Link issues. -->

## How to test

<!-- Steps / commands a reviewer can run. -->

## Checklist

- [ ] Tests first for new behavior (failing test → implementation in this PR), or characterization tests for refactors
- [ ] Coverage floor not regressed
- [ ] Frontend lint + tests + build pass (`cafe-management-sys`)
- [ ] Backend lint + tests pass (`server`)
- [ ] Activity-log rows verified for new mutations
- [ ] White-label rules respected (no hardcoded brand strings/colors)
- [ ] Docs/AGENTS updated if behavior or config changed
- [ ] No secrets committed
