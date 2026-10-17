#!/usr/bin/env node

/**
 * Jules GitHub Issue Solver Runner (Cruise-web)
 */

import {
  discoverSource,
  createSession,
  writeStepSummary,
  sanitizeLog,
  redactSensitiveData
} from './jules-client.mjs';

async function main() {
  console.log('=== Starting Google Jules Issue Solver (Cruise-web) ===');

  const apiKey = process.env.JULES_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('JULES_API_KEY is not configured or empty. Please set this GitHub secret.');
  }

  const repository = process.env.GITHUB_REPOSITORY || '';
  const [repoOwner, repoName] = repository.split('/');
  if (!repoOwner || !repoName) {
    throw new Error(`Invalid GITHUB_REPOSITORY format: "${repository}". Expected "owner/repo".`);
  }

  const issueNumber = process.env.ISSUE_NUMBER;
  const issueTitle = process.env.ISSUE_TITLE || 'Untitled Issue';
  const rawIssueBody = process.env.ISSUE_BODY || 'No description provided.';
  const issueUrl = process.env.ISSUE_URL || `https://github.com/${repository}/issues/${issueNumber}`;
  const defaultBranch = process.env.DEFAULT_BRANCH || 'main';

  if (!issueNumber) {
    throw new Error('ISSUE_NUMBER environment variable is missing.');
  }

  const issueBody = redactSensitiveData(rawIssueBody);

  console.log(sanitizeLog(`Repository: ${repoOwner}/${repoName}`));
  console.log(sanitizeLog(`Issue #${issueNumber}: "${issueTitle}"`));

  // Step 1: Discover connected Jules source
  console.log('Discovering connected Jules source via Sources API...');
  const { sourceName, defaultBranch: discoveredBranch } = await discoverSource(apiKey, repoOwner, repoName);
  const startingBranch = defaultBranch || discoveredBranch || 'main';
  console.log(sanitizeLog(`Discovered source: "${sourceName}" (Starting branch: "${startingBranch}")`));

  // Step 2: Build prompt for Jules
  const prompt = `You are the autonomous senior AI frontend maintainer for "${repoName}".

### Task: Resolve GitHub Issue #${issueNumber}
**Issue Title:** ${issueTitle}
**Issue Link:** ${issueUrl}

**Issue Description:**
${issueBody}

### Development & Quality Instructions:
1. **Analyze:** Carefully review the existing React / TypeScript architecture, components, and Vitest test suites.
2. **Implement:** Implement the clean, responsive solution in TypeScript/React resolving the issue.
3. **Verify with Tests:** Run \`npm run lint\` and \`npm test\` to ensure no lint warnings, type errors, or broken tests exist.
4. **Pull Request:** Include \`Resolves #${issueNumber}\` in the PR description with clear explanations.`;

  const sessionTitle = `Resolve Issue #${issueNumber}: ${issueTitle.slice(0, 60)}`;

  // Step 3: Create Jules session
  console.log(`Creating Jules session with automationMode: AUTO_CREATE_PR...`);
  const session = await createSession(apiKey, {
    prompt,
    title: sessionTitle,
    sourceName,
    startingBranch,
    requirePlanApproval: false,
    automationMode: 'AUTO_CREATE_PR'
  });

  console.log(sanitizeLog(`Successfully created Jules session! ID: ${session.id || session.name}`));
  const sessionUrl = session.url || `https://jules.google.com/session/${session.id || ''}`;

  writeStepSummary(`### 🤖 Google Jules Issue Solver Launched

| Parameter | Value |
| :--- | :--- |
| **Issue** | [#${issueNumber} - ${issueTitle}](${issueUrl}) |
| **Session Title** | \`${sessionTitle}\` |
| **Session ID** | \`${session.id || session.name}\` |
| **Status** | \`${session.state || 'QUEUED'}\` |
| **Target Branch** | \`${startingBranch}\` |
| **Jules Console** | [Open in Jules](${sessionUrl}) |

*Jules is actively analyzing Issue #${issueNumber}, writing the frontend solution, running Vitest tests, and opening a Pull Request.*
`);
}

main().catch(err => {
  console.error(sanitizeLog(`Error executing Jules issue solver: ${err.message}`));
  writeStepSummary(`### ❌ Jules Issue Solver Failed
\`\`\`
${err.message}
\`\`\`
`);
  process.exit(1);
});
