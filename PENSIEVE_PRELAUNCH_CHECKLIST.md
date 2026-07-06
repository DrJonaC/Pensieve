# Pensieve Prelaunch Checklist

## Product Readiness

- Confirm the dashboard opens through the mock host shell and remains usable in both compact and expanded states.
- Confirm local memory persistence survives page refreshes through `data/pensieve-memory-records.json`.
- Confirm governance tiers render as expected:
  - `Full view`
  - `Soft mask`
  - `Protected view`
- Confirm protected memories never reveal raw sensitive content by default.

## Interaction Checks

- Test `pin`, `unpin`, `soften`, `unsoften`, `restore`, and `hide`.
- Confirm `hide` shows a soft confirmation for normal memories.
- Confirm `hide` shows a stronger confirmation for protected memories.
- Confirm the selected memory remains stable after non-destructive actions.
- Confirm the empty-memory state renders cleanly if all visible memories are hidden.

## Empty And Edge States

- Verify the keyword panel shows a quiet empty state when no visible keywords remain.
- Verify surfaced themes show a quiet empty state when no theme clusters can be derived.
- Verify snapshot messaging remains readable when total memory count is `0`.
- Verify the host-hidden state renders correctly when the mock host collapses visibility.
- Verify the host boot and host error states remain understandable.

## Governance And Safety

- Review seed records in `data/pensieve-memory-records.json` and confirm they are safe for public repository distribution.
- Confirm `origin_tp`, `risk_level`, and `info_type` produce the intended governance tier.
- Confirm metadata stays visible while sensitive semantic payload is reduced.
- Confirm no irreversible deletion action exists in the current UI.

## Engineering Checks

- Run `tsc --noEmit -p tsconfig.json`.
- Run focused Node tests for:
  - dashboard core
  - governance
  - mock host
  - file repository
- Confirm `.codex-plugin/plugin.json` still matches the current plugin identity.
- Confirm `CODEX_PLUGIN_INSTALL.md` still matches the repository layout and install story.

## Publish Decision

Pensieve is ready for a source-repository release when:

- the plugin manifest is accurate
- the local persistence story is stable
- the governance behavior is intentional
- the mock-host dashboard experience is visually and behaviorally acceptable
- installation instructions can be followed without hidden repo knowledge
