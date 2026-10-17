/**
 * Comprehensive Unit Tests for Jules Autonomous Maintainer (Cruise-web)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  redactSensitiveData,
  truncateLog,
  discoverSource,
  checkDuplicateSession,
  createSession,
  generateAuditPrompt,
  generateFixCiPrompt,
  shouldTriggerCiRepair
} from './jules-client.mjs';

test('1. Sensitive Data Redaction Tests', async (t) => {
  await t.test('Redacts Google API Keys', () => {
    const input = 'Key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q in request';
    const output = redactSensitiveData(input);
    assert.doesNotMatch(output, /AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q/);
    assert.match(output, /\[REDACTED_GOOGLE_API_KEY\]/);
  });

  await t.test('Redacts GitHub Personal Access Tokens and OAuth tokens', () => {
    const input = 'Tokens: ghp_1234567890abcdef1234567890abcdef123456 and gho_abcdef1234567890abcdef1234567890123456';
    const output = redactSensitiveData(input);
    assert.doesNotMatch(output, /ghp_/);
    assert.doesNotMatch(output, /gho_/);
    assert.match(output, /\[REDACTED_GITHUB_TOKEN\]/);
  });

  await t.test('Redacts Bearer and Basic authentication headers', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDc';
    const output = redactSensitiveData(input);
    assert.doesNotMatch(output, /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/);
    assert.match(output, /Bearer \[REDACTED_BEARER_TOKEN\]/);
  });

  await t.test('Redacts explicit secrets passed via extraSecrets', () => {
    const secret = 'MY_NPM_SECRET_TOKEN_XYZ';
    const input = `export NPM_TOKEN=${secret}`;
    const output = redactSensitiveData(input, [secret]);
    assert.doesNotMatch(output, /MY_NPM_SECRET_TOKEN_XYZ/);
    assert.match(output, /\[REDACTED_SECRET\]/);
  });
});

test('2. Log Truncation & Bounding Tests', async (t) => {
  await t.test('Preserves short logs unmodified', () => {
    const shortLog = 'Line 1\nLine 2';
    assert.equal(truncateLog(shortLog, 10, 1000), shortLog);
  });

  await t.test('Truncates logs exceeding maxLines with context kept', () => {
    const lines = [];
    for (let i = 1; i <= 300; i++) lines.push(`Line ${i}`);
    const output = truncateLog(lines.join('\n'), 50, 20000);
    assert.match(output, /Line 1/);
    assert.match(output, /Line 300/);
    assert.match(output, /\[TRUNCATED 250 LINES OF INTERMEDIATE LOGS\]/);
  });
});

test('3. Jules Source Discovery Tests', async (t) => {
  await t.test('Discovers exact matching source case-insensitively', async () => {
    const mockSources = [
      {
        name: 'sources/github-Cruise-JavaCLass-Cruise-web',
        githubRepo: {
          owner: 'Cruise-JavaCLass',
          repo: 'Cruise-web',
          defaultBranch: { displayName: 'main' }
        }
      }
    ];

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ sources: mockSources })
    });

    const result = await discoverSource('test-key', 'cruise-javaclass', 'cruise-web', { fetchFn: mockFetch });
    assert.equal(result.sourceName, 'sources/github-Cruise-JavaCLass-Cruise-web');
    assert.equal(result.defaultBranch, 'main');
  });

  await t.test('Handles authentication error (HTTP 401)', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    });

    await assert.rejects(
      async () => discoverSource('invalid-key', 'Cruise-JavaCLass', 'Cruise-web', { fetchFn: mockFetch }),
      /Jules API Authentication failed \(HTTP 401\)/
    );
  });
});

test('4. Session Deduplication Tests', async (t) => {
  await t.test('Detects duplicate CI repair session by run ID', async () => {
    const mockSessions = [
      {
        id: 'sess-web-1',
        title: 'Fix Frontend CI Failure: Run 7777777',
        state: 'IN_PROGRESS',
        createTime: new Date().toISOString()
      }
    ];

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ sessions: mockSessions })
    });

    const result = await checkDuplicateSession('test-key', { runId: '7777777' }, { fetchFn: mockFetch });
    assert.equal(result.isDuplicate, true);
    assert.equal(result.existingSession.id, 'sess-web-1');
  });
});

test('5. Session Creation API Request Tests', async (t) => {
  await t.test('Builds valid request payload according to Jules spec', async () => {
    let capturedBody = {};
    const mockFetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'sess-web-ok', state: 'QUEUED' })
      };
    };

    const session = await createSession('test-key', {
      prompt: 'Fix vitest assertions',
      title: 'Weekly Frontend Audit',
      sourceName: 'sources/github-Cruise-JavaCLass-Cruise-web',
      startingBranch: 'main'
    }, { fetchFn: mockFetch });

    assert.equal(capturedBody.prompt, 'Fix vitest assertions');
    assert.equal(capturedBody.automationMode, 'AUTO_CREATE_PR');
    assert.equal(session.id, 'sess-web-ok');
  });
});

test('6. Prompt Generation Tests', async (t) => {
  await t.test('Generates audit prompt referencing React, TypeScript, and npm commands', () => {
    const prompt = generateAuditPrompt({ scope: 'full', defaultBranch: 'main', repoName: 'Cruise-web' });
    assert.match(prompt, /React 18\/19/);
    assert.match(prompt, /npm run lint/);
    assert.match(prompt, /npm run test:ci/);
    assert.match(prompt, /AUTO_CREATE_PR/);
  });

  await t.test('Generates CI failure prompt with Vitest, Oxlint, and Vite references', () => {
    const prompt = generateFixCiPrompt({
      runUrl: 'https://github.com/Cruise-JavaCLass/Cruise-web/actions/runs/888',
      runId: '888',
      commitSha: 'c0ffee',
      branch: 'main',
      failedJobs: [{ name: 'Build & Test', failedStep: 'Run Vitest' }],
      failureSummary: 'FAIL src/components/ExcursionCard.test.tsx'
    });

    assert.match(prompt, /888/);
    assert.match(prompt, /c0ffee/);
    assert.match(prompt, /npm run test:ci/);
  });
});

test('7. Workflow YAML Structure & Safety Policy Verification', () => {
  const auditPath = new URL('../workflows/jules-audit.yml', import.meta.url);
  const fixCiPath = new URL('../workflows/jules-fix-ci.yml', import.meta.url);

  assert.ok(existsSync(auditPath), 'jules-audit.yml must exist in Cruise-web');
  assert.ok(existsSync(fixCiPath), 'jules-fix-ci.yml must exist in Cruise-web');

  const auditContent = readFileSync(auditPath, 'utf8');
  const fixCiContent = readFileSync(fixCiPath, 'utf8');

  assert.match(auditContent, /cron:\s*['"]0 3 \* \* \*['"]/);
  assert.match(fixCiContent, /Frontend CI Pipeline/);
  assert.match(fixCiContent, /github\.event\.workflow_run\.conclusion == 'failure'/);
  assert.match(auditContent, /contents:\s*read/);
  assert.match(fixCiContent, /contents:\s*read/);
});

test('8. CI Failure Filtering & Safety Decision Tests', () => {
  const validEvent = {
    eventName: 'workflow_run',
    workflowRun: {
      name: 'Frontend CI Pipeline',
      conclusion: 'failure',
      headBranch: 'main'
    }
  };
  assert.equal(shouldTriggerCiRepair(validEvent, 'main').shouldTrigger, true);

  const ignoredWorkflow = {
    eventName: 'workflow_run',
    workflowRun: {
      name: 'Backend CI Pipeline',
      conclusion: 'failure',
      headBranch: 'main'
    }
  };
  assert.equal(shouldTriggerCiRepair(ignoredWorkflow, 'main').shouldTrigger, false);

  const nonDefaultBranch = {
    eventName: 'workflow_run',
    workflowRun: {
      name: 'Frontend CI Pipeline',
      conclusion: 'failure',
      headBranch: 'feature/untrusted'
    }
  };
  assert.equal(shouldTriggerCiRepair(nonDefaultBranch, 'main').shouldTrigger, false);
});
