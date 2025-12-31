/**
 * Smoke test: auth + org isolation + "global endpoints are super-admin only"
 *
 * Usage (PowerShell):
 *   cd backend
 *   $env:API_URL="http://localhost:3000"
 *   $env:DEV_ADMIN_SECRET="..."   # optional but recommended
 *   npm run smoke:authz
 *
 * If you don't have DEV_ADMIN_SECRET, provide SUPER_ADMIN_TOKEN instead:
 *   $env:SUPER_ADMIN_TOKEN="BearerToken..."
 */

const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const DEV_ADMIN_SECRET = process.env.DEV_ADMIN_SECRET || '';
const SUPER_ADMIN_TOKEN = process.env.SUPER_ADMIN_TOKEN || '';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function rand(prefix) {
  const n = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `${prefix}_${n}`;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function http(method, path, { token, orgId, body, expected, extraHeaders } = {}) {
  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['X-Org-Id'] = String(orgId);
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (expected) {
    const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
    if (!ok) {
      const expStr = Array.isArray(expected) ? expected.join(',') : String(expected);
      throw new Error(
        `HTTP ${method} ${path} expected ${expStr}, got ${res.status}. Response: ${typeof data === 'string' ? data : JSON.stringify(data)}`,
      );
    }
  }

  return { status: res.status, data };
}

async function registerAndLogin(username, password) {
  await http('POST', '/auth/register', { body: { username, password }, expected: [200, 201] });
  const login = await http('POST', '/auth/login', { body: { username, password }, expected: [200, 201] });
  assert(login?.data?.token, 'login did not return token');
  const token = login.data.token;
  const me = await http('GET', '/auth/me', { token, expected: 200 });
  return { token, me: me.data };
}

async function ensureSuperAdminToken(saUsername, saPassword, saTokenMaybe) {
  if (SUPER_ADMIN_TOKEN) {
    // Assume it's already a valid JWT token string (not "Bearer ...")
    const me = await http('GET', '/auth/me', { token: SUPER_ADMIN_TOKEN, expected: 200 });
    assert(me?.data?.isSuperAdmin === true, 'SUPER_ADMIN_TOKEN is not a super admin token');
    return SUPER_ADMIN_TOKEN;
  }

  if (!DEV_ADMIN_SECRET) {
    throw new Error('Need either DEV_ADMIN_SECRET or SUPER_ADMIN_TOKEN to run super-admin smoke checks.');
  }

  // Promote user, then re-login to get fresh token with isSuperAdmin=true in payload
  await http('POST', '/dev/make-super-admin', {
    body: { username: saUsername },
    extraHeaders: { 'X-Dev-Secret': DEV_ADMIN_SECRET },
    expected: [200, 201],
  });

  // re-login
  const login = await http('POST', '/auth/login', { body: { username: saUsername, password: saPassword }, expected: [200, 201] });
  const saToken = login.data.token;
  const me = await http('GET', '/auth/me', { token: saToken, expected: 200 });
  assert(me?.data?.isSuperAdmin === true, 'Promoted user is not super admin (check DEV_ADMIN_SECRET / dev module enabled).');
  return saToken;
}

async function main() {
  console.log(`[smoke-authz] API_URL=${API_URL}`);

  // Basic connectivity check
  await http('GET', '/', { expected: [200, 404] }).catch(() => {
    // ignore: some apps don't have root route
  });

  const password = 'P@ssw0rd123!';
  const aliceU = rand('alice');
  const bobU = rand('bob');
  const saU = rand('sa');

  const alice = await registerAndLogin(aliceU, password);
  const bob = await registerAndLogin(bobU, password);
  const saBase = await registerAndLogin(saU, password);

  // Create orgs
  const orgA = await http('POST', '/orgs', { token: alice.token, body: { name: rand('orgA') }, expected: [200, 201] });
  const orgB = await http('POST', '/orgs', { token: bob.token, body: { name: rand('orgB') }, expected: [200, 201] });
  const orgAId = orgA.data.id;
  const orgBId = orgB.data.id;
  assert(typeof orgAId === 'number' && orgAId > 0, 'orgA id missing');
  assert(typeof orgBId === 'number' && orgBId > 0, 'orgB id missing');

  // Create project in orgA
  const projA = await http('POST', '/projects', {
    token: alice.token,
    orgId: orgAId,
    body: { name: rand('projA'), description: 'smoke' },
    expected: [200, 201],
  });
  const projAId = projA.data.id;
  assert(typeof projAId === 'number' && projAId > 0, 'projA id missing');

  // Sanity: creator should be project admin
  const projAGet = await http('GET', `/projects/${projAId}`, { token: alice.token, orgId: orgAId, expected: 200 });
  assert(projAGet?.data?.role === 'admin', `expected project role=admin, got ${String(projAGet?.data?.role)}`);
  const projAMembers = await http('GET', `/projects/${projAId}/members`, { token: alice.token, orgId: orgAId, expected: 200 });
  assert(Array.isArray(projAMembers.data), 'expected project members array');
  assert(projAMembers.data.some((m) => m.username === aliceU && m.role === 'admin'), 'project members should include creator as admin');

  // Create WBS + tasks
  const wbs = await http('POST', '/wbs-items', {
    token: alice.token,
    orgId: orgAId,
    body: { projectId: projAId, name: 'WBS-1', description: 'smoke', duration: 5 },
    expected: [200, 201],
  });
  const wbsId = wbs.data.id;
  assert(typeof wbsId === 'number' && wbsId > 0, 'wbs id missing');

  const task1 = await http('POST', '/tasks', {
    token: alice.token,
    orgId: orgAId,
    body: { wbsItemId: wbsId, name: 'T1', duration: 2, status: 'not_started', percentComplete: 0 },
    expected: [200, 201],
  });
  const task2 = await http('POST', '/tasks', {
    token: alice.token,
    orgId: orgAId,
    body: { wbsItemId: wbsId, name: 'T2', duration: 3, status: 'not_started', percentComplete: 0 },
    expected: [200, 201],
  });
  const task1Id = task1.data.id;
  const task2Id = task2.data.id;
  assert(typeof task1Id === 'number' && typeof task2Id === 'number', 'task ids missing');

  await http('POST', '/dependencies', {
    token: alice.token,
    orgId: orgAId,
    body: { taskId: task2Id, predecessorId: task1Id, type: 'FS', lag: 0 },
    expected: [200, 201],
  });

  // Schedule compute (admin only)
  await http('POST', '/schedule-runs/compute', {
    token: alice.token,
    orgId: orgAId,
    body: { projectId: projAId, runType: 'initial' },
    expected: [200, 201],
  });

  // Score compute (admin only)
  await http('POST', '/scores/compute', {
    token: alice.token,
    orgId: orgAId,
    body: {
      projectId: projAId,
      moduleCompleteness: 20,
      e2eAvailability: 20,
      milestonePercent: 60,
      difficulty: 'N',
      actualDeliveryDays: 10,
      baselineDays: 10,
      earlyDeliveryDays: 0,
      algorithmQuality: 4,
      architectureQuality: 8,
      codeStyle: 4,
      securityScanScore: 90,
      e2eSecurityTestScore: 90,
      authSessionScore: 90,
      configHardeningScore: 90,
    },
    expected: [200, 201],
  });

  // ---- Non-superadmin checks ----
  // Bob cannot read orgA project resources (even if he uses his own org header)
  await http('GET', `/tasks?projectId=${projAId}`, { token: bob.token, orgId: orgBId, expected: 403 });

  // Global list endpoints should be blocked for non-super users
  await http('GET', '/tasks', { token: alice.token, orgId: orgAId, expected: 400 });
  await http('GET', '/wbs-items', { token: alice.token, orgId: orgAId, expected: 400 });
  await http('GET', '/dependencies', { token: alice.token, orgId: orgAId, expected: 400 });
  await http('GET', '/schedule-runs', { token: alice.token, orgId: orgAId, expected: 403 });
  await http('GET', '/schedule-runs/items', { token: alice.token, orgId: orgAId, expected: 403 });

  // ---- Super admin checks ----
  const saToken = await ensureSuperAdminToken(saU, password, saBase.token);

  // Super admin should be able to access global list endpoints, but still org-scoped by X-Org-Id
  const tasksOrgA = await http('GET', '/tasks', { token: saToken, orgId: orgAId, expected: 200 });
  const tasksOrgB = await http('GET', '/tasks', { token: saToken, orgId: orgBId, expected: 200 });
  assert(Array.isArray(tasksOrgA.data), 'super admin /tasks should return array');
  assert(Array.isArray(tasksOrgB.data), 'super admin /tasks should return array');
  assert(tasksOrgA.data.some((t) => t.id === task1Id || t.id === task2Id), 'orgA super list should include created tasks');
  assert(!tasksOrgB.data.some((t) => t.id === task1Id || t.id === task2Id), 'orgB super list should NOT include orgA tasks');

  await http('GET', '/wbs-items', { token: saToken, orgId: orgAId, expected: 200 });
  await http('GET', '/dependencies', { token: saToken, orgId: orgAId, expected: 200 });
  await http('GET', '/schedule-runs', { token: saToken, orgId: orgAId, expected: 200 });
  await http('GET', '/schedule-runs/items', { token: saToken, orgId: orgAId, expected: 200 });

  // Super admin can compute too (not a member)
  await http('POST', '/schedule-runs/compute', {
    token: saToken,
    orgId: orgAId,
    body: { projectId: projAId, runType: 'rolling' },
    expected: [200, 201],
  });

  console.log('[smoke-authz] PASS');
}

main().catch((e) => {
  console.error('[smoke-authz] FAIL:', e?.message || e);
  process.exit(1);
});


