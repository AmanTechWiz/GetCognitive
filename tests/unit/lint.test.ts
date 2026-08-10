/**
 * Lint test — verifies that ESLint runs successfully on the source code
 * and that the MDX content directory is excluded.
 *
 * This test shells out to the ESLint CLI and asserts:
 *  - exit code 0 on valid source files
 *  - MDX content files are not linted (not reported)
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const root = path.resolve(__dirname, '../..');

// 60-second timeout for all lint tests (ESLint startup is slow in CI)
const LINT_TIMEOUT = 60_000;

function runLint(args: string) {
  try {
    const output = execSync(`npx eslint ${args} --format json`, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 50_000,
    });
    return { exitCode: 0, output };
  } catch (err: unknown) {
    const error = err as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: error.status ?? 1,
      output: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

describe('ESLint configuration', () => {
  it(
    'exits 0 when linting clean utility file (lib/cn.ts)',
    () => {
      const { exitCode } = runLint('lib/cn.ts');
      expect(exitCode).toBe(0);
    },
    LINT_TIMEOUT,
  );

  it(
    'produces no errors on the lib/ utility files',
    () => {
      const { exitCode, output } = runLint('lib/');
      const results = JSON.parse(output || '[]') as Array<{ errorCount: number }>;
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
      expect(exitCode).toBe(0);
      expect(totalErrors).toBe(0);
    },
    LINT_TIMEOUT,
  );

  it(
    'does NOT lint MDX content files (content/ is in ignores)',
    () => {
      // In ESLint v9 flat config, ignored files produce zero file results.
      // We lint a specific .mdx file and expect it to be absent from results.
      const mdxFile = 'content/docs/mdx/overview.mdx';
      const { output } = runLint(mdxFile);
      const results = JSON.parse(output || '[]') as Array<{ filePath: string }>;
      // Ignored files are not included in JSON output at all
      expect(results.length).toBe(0);
    },
    LINT_TIMEOUT,
  );

  it(
    'detects errors in a deliberately bad snippet (no-var)',
    () => {
      const tmpFile = path.join(root, '__lint_test_tmp__.ts');
      writeFileSync(tmpFile, 'var x = 1\n', 'utf8');
      try {
        const { exitCode, output } = runLint(tmpFile);
        const results = JSON.parse(output || '[]') as Array<{
          errorCount: number;
          warningCount: number;
        }>;
        const total = results.reduce((sum, r) => sum + r.errorCount + r.warningCount, 0);
        // `var` should be flagged as an error by the 'no-var' rule
        expect(total).toBeGreaterThan(0);
        expect(exitCode).not.toBe(0);
      } finally {
        unlinkSync(tmpFile);
      }
    },
    LINT_TIMEOUT,
  );
});
