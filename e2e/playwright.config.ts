import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.e2e' });

export default defineConfig({
  // 指定测试目录
  testDir: ['./tests', '../frontend/project_milestone_frontend/e2e'],
  /* 最大测试超时 */
  timeout: 60 * 1000,
  expect: {
    /* expect 超时 */
    timeout: 5000,
  },
  /* CI 环境下禁止 test.only */
  forbidOnly: !!process.env.CI,
  /* CI 环境下重试次数 */
  retries: process.env.CI ? 2 : 0,
  /* 并行 worker 数 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告格式 */
  reporter: [['html', { open: 'never' }]],
  use: {
    /* 测试用例访问的基础地址，由环境变量提供 */
    baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    /* 若需要授权，可通过环境变量 E2E_JWT 提供 Token */
    extraHTTPHeaders: {
      Authorization: `Bearer ${process.env.E2E_JWT || '<请填写测试用JWT>'}`,
    },
    /* 失败时收集 trace */
    trace: 'on-first-retry',
    /* 是否无头模式 */
    headless: process.env.CI ? true : false,
  },
  /* 浏览器配置 */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  /* 测试产物输出目录 */
  outputDir: 'test-results/',
  /* 启动本地服务器配置 */
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
