# AI Coding Agent & Contributor Directives (AGENTS.md)

This repository (`Cruise-web`) contains the React + TypeScript frontend web application for the **Cruise Activity and Service Management System**.
All AI coding agents (Claude, Copilot, Jules, Gemini, Antigravity, etc.) and human developers working in this repository must strictly adhere to the policies established in this document.

---

## 1. Jira Project & Issue Key Rules

- **Jira Project Key:** `KAN` (Domain: `https://huytran20052022.atlassian.net/`)
- **Hierarchy:**
  - **Epic:** Major capability (e.g., Shore Excursion Management, Passenger Web Portal).
  - **Story / Task:** Deliverable functional unit (e.g., `KAN-185`: Implement Excursion Status Tracking).
  - **Subtask:** Specific frontend view or component test (e.g., `KAN-192`: Status Dashboard UI, `KAN-194`: Component tests).
- **Rule of Record:** Every feature branch, commit message, and PR title MUST explicitly reference a valid Jira issue key (`KAN-xxx`).
- **Do Not Fabricate Keys:** Always verify the Jira issue key from the active user prompt or Jira API.
- **Completion Guarantee:** Merely opening a PR does NOT mark a Jira task Done. An issue is only eligible for `Done` once CI passes, code review completes without blocking comments, and the PR is merged to `main`.

---

## 2. Branching Strategy (GitHub Flow)

- **Default & Protected Branch:** `main` (Strictly protected; NO direct pushes allowed).
- **Branch Naming Standard:**
  - `feat/KAN-xxx-short-description` (New components / pages / state stores)
  - `fix/KAN-xxx-short-description` (Bug fixes / UI rendering issues)
  - `test/KAN-xxx-short-description` (Component test suites / mock fixtures)
  - `docs/KAN-xxx-short-description` (Documentation / Storybook updates)
  - `refactor/KAN-xxx-short-description` (Refactoring UI logic without behavior change)
  - `chore/KAN-xxx-short-description` (Dependency updates / Vite / oxlint configs)
- **Scope:**
  - Develop on one feature branch per parent story/deliverable. Related subtasks share the parent branch.
  - Never stage or commit unrelated changes.
  - Verify `git status` and working tree before creating commits.

---

## 3. Commit Message Conventions

Follow Conventional Commits with Jira issue reference:

```
[<JIRA-KEY>] <type>(<scope>): <concise description in imperative mood>

[optional body explaining rationale]
```

### Commit Types:
- `feat`: New React component, page, or client feature.
- `fix`: Bug fix in UI behavior or API client integration.
- `test`: Vitest component tests or test utilities.
- `refactor`: Refactoring component hierarchy or state hooks.
- `docs`: Documentation updates.
- `chore`: npm packages, Vite config, oxlint config.

---

## 4. Pull Request Standards & Title Format

- **PR Title Format:**
  ```
  [KAN-xxx] type: concise description
  ```
  *Example:* `[KAN-185] feat: build excursion status dashboard, schedule timing display, and component test suite`
- **PR Description:** Must follow the repository PR template (`.github/PULL_REQUEST_TEMPLATE.md`), containing:
  - Summary (1–3 sentences explaining the outcome).
  - Changes made (bulleted list).
  - Testing performed and verified evidence.
  - Jira ticket link (`https://huytran20052022.atlassian.net/browse/KAN-xxx`).
  - Notes & UI screenshots when applicable.
- **Validation:**
  - Never submit raw escape sequences (`\n\n`) in PR markdown.
  - Ensure all assertions, test names, and files changed match the actual git diff.

---

## 5. Testing & Code Quality Gates

- **Frontend Stack:** Node.js 22/24, React 19, TypeScript 5, Vite, Vitest, Testing Library, oxlint.
- **Mandatory Local Verification:**
  Before pushing, execute the verification suite:
  ```powershell
  npm run lint
  npm run test:ci
  npm run build
  ```
- **Testing Requirements:**
  - Comprehensive unit/component tests (`*.test.tsx`) covering rendering, user events, and error handling.
  - Oxlint must report 0 errors and 0 warnings.
  - Production build (`npm run build`) must succeed without type or asset errors.

---

## 6. AI-Assisted Remediation & Safety Guardrails

When an AI agent is invoked to triage or repair a build/CI failure:
1. **Analyze Failure Logs:** Inspect Oxlint syntax errors, TypeScript compile diagnostics, or Vitest failures.
2. **Minimal Patch Principle:** Apply targeted, minimal fixes within the authorized task scope.
3. **No Secret Exposure:** Never hardcode API keys, service tokens, or credentials in client bundles.
4. **No Breaking Changes:** Preserve existing public props, hooks, and responsive design patterns.
