import { test, expect } from '@playwright/test';

// 从环境变量读取基础地址
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || '<请填写前端测试地址>';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || '<请填写后端测试地址>';

// 测试前端主页访问
test('访问前端主页', async ({ page }) => {
  await page.goto(FRONTEND_BASE_URL);
  // TODO: 替换为实际页面标题
  await expect(page).toHaveTitle('<请填写预期页面标题>');
});

// 测试后端健康检查接口
test('后端健康检查', async ({ request }) => {
  const response = await request.get(`${BACKEND_BASE_URL}/health`);
  expect(response.ok()).toBeTruthy();
});

// 用户登录流程
test('用户登录流程', async ({ page }) => {
  await page.goto(`${FRONTEND_BASE_URL}/login`);
  // TODO: 根据实际表单字段修改选择器
  await page.fill('input[name="email"]', process.env.E2E_USER_EMAIL || '<请填写测试用户邮箱>');
  await page.fill('input[name="password"]', process.env.E2E_USER_PASSWORD || '<请填写测试用户密码>');
  await page.click('button[type="submit"]');
  // TODO: 修改为登录成功后跳转的页面路径
  await expect(page).toHaveURL(`${FRONTEND_BASE_URL}/`);
});

// 项目列表展示
test('项目列表展示', async ({ page }) => {
  await page.goto(`${FRONTEND_BASE_URL}/projects`);
  // TODO: 修改为项目列表项的选择器
  const projectList = page.locator('.project-item');
  await expect(projectList).toHaveCount(1);
});

// 任务创建与更新
test('任务创建与更新', async ({ page }) => {
  await page.goto(`${FRONTEND_BASE_URL}/projects/1`);
  // TODO: 修改为添加任务按钮的选择器
  await page.click('button.add-task');
  // TODO: 修改为任务名称输入框选择器
  await page.fill('input[name="taskName"]', '测试任务');
  // TODO: 修改为提交按钮选择器
  await page.click('button.submit-task');
  // TODO: 修改为任务列表项选择器
  const taskItem = page.locator('.task-item', { hasText: '测试任务' });
  await expect(taskItem).toBeVisible();
  // 更新任务
  // TODO: 修改为编辑任务按钮选择器
  await taskItem.locator('button.edit-task').click();
  // TODO: 修改为任务名称输入框选择器
  await page.fill('input[name="taskName"]', '测试任务-已更新');
  await page.click('button.submit-task');
  await expect(page.locator('.task-item', { hasText: '测试任务-已更新' })).toBeVisible();
});

// 权限校验
test('权限校验', async ({ request }) => {
  // 未登录访问需鉴权接口
  const response = await request.get(`${BACKEND_BASE_URL}/protected/resource`);
  expect(response.status()).toBe(401);
});
