# Autonomous GitHub Repository Maintainer Powered by Google Jules (Cruise-web)

## 1. Overview & Architecture

This frontend repository is maintained autonomously by **Google Jules**, connecting GitHub Actions with the official **Google Jules REST API (`v1alpha`)**:

1. **Weekly & On-Demand Frontend Audit (`.github/workflows/jules-audit.yml`):**
   Scans React components, TypeScript types, and Vitest test suites. Proposes clean improvements, executes `npm run lint` and `npm run test:ci`, and opens a structured Pull Request.
2. **Automatic CI Failure Repair (`.github/workflows/jules-fix-ci.yml`):**
   Monitors the primary `Frontend CI Pipeline` on `main`. When a CI run fails (e.g. Oxlint errors, Vitest test failure, TypeScript type error, or Vite build break), Jules investigates the failure logs, implements a minimal fix and regression test, and submits a PR.

---

## 2. Setup & Configuration

### 2.1. Add Repository Secret
In GitHub (**Settings** > **Secrets and variables** > **Actions**), add:
- `JULES_API_KEY`: Official Google Jules API key (starts with `AIza...`).

### 2.2. Connect to Google Jules
Ensure `Cruise-JavaCLass/Cruise-web` is connected in [Google Jules Console](https://jules.google). The workflow automatically queries `GET /v1alpha/sources` to identify the source.

---

## 3. Workflows

### 3.1. Weekly Audit (`jules-audit.yml`)
- **Schedule:** Every Monday at **03:00 UTC** (`cron: '0 3 * * 1'`).
- **Manual Trigger:** Run via **Actions** > **Jules Repository Audit** with options: `full`, `bugs`, `tests`, `security`, `code-quality`, `documentation`.
- **Deduplication:** Prevents opening duplicate audits if an audit occurred within the past 24 hours (bypassable with `force_audit: true`).

### 3.2. CI Failure Repair (`jules-fix-ci.yml`)
- **Trigger:** Automated on failed completion of `Frontend CI Pipeline` on branch `main`.
- **Security:**
  - Ignores success/cancelled runs.
  - Ignores untrusted external PR branches.
  - Redacts sensitive credentials (Google API keys, GitHub tokens, Bearer tokens).
  - Truncates failure logs to 250 lines / 25 KB.

---

## 4. Safety & Review Guidelines

1. **No Direct Push:** Jules only creates branches (`jules/...`) and opens Pull Requests (`automationMode: AUTO_CREATE_PR`).
2. **Human Review Required:** All Jules PRs must pass CI checks and be reviewed and approved by human engineers before merging.
