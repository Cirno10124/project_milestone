<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 py-10">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <h2 class="text-2xl font-semibold text-gray-900 truncate">
            项目详情 · {{ project.name || `#${projectId}` }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ project.description || '暂无描述' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <PMButton variant="secondary" type="button" @click="goToMembers">
            成员管理
          </PMButton>
        </div>
      </div>

    <!-- Git 联动配置（仅管理员可见） -->
      <PMCard v-if="isAdmin" class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Git 联动</h3>
            <p class="text-sm text-gray-500 mt-1">
              将项目绑定到 Git 仓库，并在 push 时根据 commit message 自动更新任务进度。
            </p>
          </div>
          <div class="flex items-center gap-2">
            <PMButton variant="primary" type="button" :disabled="repoSaving" @click="saveRepo">
              {{ repoSaving ? '保存中...' : '保存配置' }}
            </PMButton>
            <PMButton variant="secondary" type="button" :disabled="repoSaving" @click="rotateRepoToken">
              轮换 Token
            </PMButton>
            <PMButton variant="ghost" type="button" :disabled="repoSaving" @click="reloadRepo">
              刷新
            </PMButton>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <PMFormField label="仓库地址（URL）" required>
            <PMInput v-model="repoForm.repoUrl" placeholder="例如：http://git.xxx.local/group/repo.git" />
          </PMFormField>

          <PMFormField label="Git 服务" required>
            <select
              v-model="repoForm.repoProvider"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gitlab">GitLab</option>
              <option value="gitea">Gitea</option>
              <option value="generic">Generic</option>
            </select>
          </PMFormField>

          <PMFormField label="默认分支">
            <PMInput v-model="repoForm.repoDefaultBranch" placeholder="main / master" />
          </PMFormField>
        </div>

        <div class="mt-4">
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              v-model="repoForm.gitSyncEnabled"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            启用“commit 自动更新任务进度”
          </label>
        </div>

        <p v-if="repoError" class="text-sm text-red-600 mt-3">{{ repoError }}</p>

        <div v-if="repoInfo.webhookPath" class="mt-6">
          <h4 class="text-sm font-semibold text-gray-900">Webhook 配置</h4>
          <div class="mt-2 space-y-2">
            <div class="mono">Webhook URL：{{ apiBaseUrl }}{{ repoInfo.webhookPath }}</div>
            <div class="mono">Header：X-Project-Webhook-Token: {{ repoInfo.webhookToken }}</div>
            <div v-if="repoInfo.lastGitEventAt" class="hint">
              最后一次收到 Git 事件：{{ formatBeijingDateTime(repoInfo.lastGitEventAt) }}
            </div>
          </div>

          <h4 class="text-sm font-semibold text-gray-900 mt-4">Commit message 规则（示例）</h4>
          <div class="mt-2 space-y-2">
            <div class="mono">#task:12 progress:30%</div>
            <div class="mono">task#12 进度:80%</div>
            <div class="mono">#task:12 done</div>
          </div>
        </div>
      </PMCard>
    
    <!-- 项目开始日期设置 -->
      <PMCard v-if="isAdmin" class="mb-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">项目日期</h3>
            <p class="text-sm text-gray-500 mt-1">设置开始日期后，可计算关键路径与甘特图。</p>
          </div>
          <PMButton variant="primary" type="button" :disabled="!projectStartDate" @click="calculateDates">
            计算日期
          </PMButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 items-end">
          <PMFormField label="项目开始日期（必选）" required>
            <input
              type="date"
              v-model="projectStartDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </PMFormField>

          <div v-if="projectEndDate" class="text-sm">
            <div class="text-gray-500">项目预计完成时间</div>
            <div class="font-semibold text-gray-900 mt-1">{{ projectEndDate }}</div>
          </div>
        </div>
      </PMCard>
    
    <!-- 甘特图导出和预览 -->
      <PMCard v-if="isAdmin" class="mb-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">甘特图</h3>
            <p class="text-sm text-gray-500 mt-1">预览与导出项目排期。</p>
          </div>
          <div class="flex flex-wrap gap-2 justify-end">
            <PMButton variant="primary" type="button" @click="previewGantt">预览甘特图</PMButton>
            <PMButton variant="secondary" type="button" @click="exportGanttChart">导出 PNG</PMButton>
            <PMButton variant="secondary" type="button" @click="exportGanttSvg">导出 SVG</PMButton>
            <PMButton variant="secondary" type="button" @click="exportGanttTableExcel">导出 Excel</PMButton>
          </div>
        </div>
      </PMCard>
    
    <!-- WBS 列表 -->
      <PMCard class="mb-6">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-lg font-semibold text-gray-900">WBS 节点</h3>
          <PMButton v-if="isAdmin" variant="primary" type="button" @click="showForm = !showForm">
            {{ showForm ? '收起表单' : '添加 WBS 节点' }}
          </PMButton>
        </div>

        <div class="mt-4 space-y-2">
          <div
            v-for="item in wbsItems"
            :key="item.id"
            class="p-3 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center gap-3"
          >
            <div class="min-w-0 flex-1">
              <div class="font-medium text-gray-900 truncate">{{ item.name }}</div>
              <div class="text-xs text-gray-500 mt-1">
                持续 {{ item.duration }} 天
                <span v-if="wbsStartDates[item.id]" class="ml-2">· 最早开始：{{ wbsStartDates[item.id] }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">顺序</span>
              <input
                type="number"
                v-model.number="item.seq"
                @change="updateWbsSeq(item)"
                class="w-20 px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div v-if="wbsItems.length === 0" class="text-sm text-gray-500">暂无 WBS 节点</div>
        </div>

    <!-- 添加表单 -->
        <div v-if="showForm" class="mt-6 border-t border-gray-200 pt-6">
          <h4 class="text-sm font-semibold text-gray-900">新建 WBS 节点</h4>
          <form class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end" @submit.prevent="submitWbs">
            <PMFormField label="名称" required>
              <PMInput v-model="newItem.name" required />
            </PMFormField>
            <PMFormField label="持续天数" required>
              <input
                type="number"
                v-model.number="newItem.duration"
                min="1"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </PMFormField>
            <PMFormField label="描述">
              <PMInput v-model="newItem.description" />
            </PMFormField>
            <div class="md:col-span-3 flex justify-end">
              <PMButton variant="primary" type="submit">提交</PMButton>
            </div>
          </form>
          <p v-if="wbsError" class="text-sm text-red-600 mt-3">{{ wbsError }}</p>
        </div>
      </PMCard>

    <!-- 新建任务 -->
    <PMCard class="mb-6">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-lg font-semibold text-gray-900">任务</h3>
        <PMButton v-if="isAdmin" variant="primary" type="button" @click="showTaskForm = !showTaskForm">
          {{ showTaskForm ? '收起表单' : '新建任务' }}
        </PMButton>
      </div>

      <div v-if="showTaskForm" class="mt-6 border-t border-gray-200 pt-6">
        <h4 class="text-sm font-semibold text-gray-900">新建任务</h4>
        <form class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end" @submit.prevent="submitTask">
          <PMFormField label="选择 WBS 节点" required>
            <select
              v-model.number="newTask.wbsItemId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="item in wbsItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </PMFormField>
          <PMFormField label="任务名称" required>
            <PMInput v-model="newTask.name" required />
          </PMFormField>
          <PMFormField label="预计时长(天)" required>
            <input
              type="number"
              v-model.number="newTask.duration"
              min="1"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </PMFormField>
          <div class="md:col-span-3 flex justify-end">
            <PMButton variant="primary" type="submit">创建</PMButton>
          </div>
        </form>
        <p v-if="taskError" class="text-sm text-red-600 mt-3">{{ taskError }}</p>
      </div>

      <!-- 添加任务依赖（后继） -->
      <div v-if="isAdmin" class="mt-6 border-t border-gray-200 pt-6">
        <h4 class="text-sm font-semibold text-gray-900">添加任务后继</h4>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <PMFormField label="基准任务" required>
            <select
              v-model.number="baseTaskId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option disabled value="0">选择任务</option>
              <option v-for="t in tasks" :key="t.id" :value="t.id">#{{ t.id }} {{ t.name }}</option>
            </select>
          </PMFormField>
          <PMFormField v-if="baseTaskId" label="选择后继任务（多选）" required class="md:col-span-2">
            <select
              v-model="succIds"
              multiple
              size="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="t in allowedSuccessors" :key="t.id" :value="t.id">#{{ t.id }} {{ t.name }}</option>
            </select>
          </PMFormField>
          <div class="md:col-span-3 flex items-center justify-between gap-3">
            <p v-if="depError" class="text-sm text-red-600">{{ depError }}</p>
            <PMButton variant="primary" type="button" @click="submitDependency">创建后继依赖</PMButton>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="mt-6 border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between gap-4">
          <h4 class="text-sm font-semibold text-gray-900">任务列表</h4>
          <div class="flex items-center gap-3" v-if="isAdmin">
            <PMButton variant="secondary" type="button" :disabled="scheduleLoading" @click="runCriticalPathAnalysis">
              {{ scheduleLoading ? '关键路径分析中...' : '运行关键路径分析' }}
            </PMButton>
            <span v-if="scheduleSummary" class="text-sm text-gray-500">{{ scheduleSummary }}</span>
          </div>
        </div>
        <p v-if="scheduleError" class="text-sm text-red-600 mt-3">{{ scheduleError }}</p>

        <div class="mt-4 overflow-x-auto">
          <table v-if="tasks.length > 0" class="task-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>处理人</th>
          <th>预计时长</th>
          <th>前置任务</th>
          <th>后续任务</th>
          <th>ES</th>
          <th>EF</th>
          <th>LS</th>
          <th>LF</th>
          <th>时差(slack)</th>
          <th>完成情况</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tasks" :key="t.id" :class="{ critical: criticalTaskIds?.has(t.id) }">
          <td>
            <span v-if="criticalTaskIds?.has(t.id)" class="critical-badge">关键</span>
            #{{ t.id }} {{ t.name }}
          </td>
          <td>
            <span v-if="getAssigneeNames(t).length">{{ getAssigneeNames(t).join(', ') }}</span>
            <span v-else>-</span>
            <PMButton v-if="isAdmin" variant="ghost" type="button" class="ml-2" @click="openAssign(t)">
              转派
            </PMButton>
          </td>
          <td>{{ t.duration ?? '-' }} 天</td>
          <td>
            <span v-if="t.predecessors?.length">
              {{ t.predecessors
                .map(dep => dep.predecessor?.name)
                .filter(name => name)
                .join(', ') }}
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="t.successors?.length">
              {{ t.successors
                .map(dep => dep.task?.name)
                .filter(name => name)
                .join(', ') }}
            </span>
            <span v-else>-</span>
          </td>
          <td>{{ getScheduleField(t.id, 'earlyStart') }}</td>
          <td>{{ getScheduleField(t.id, 'earlyFinish') }}</td>
          <td>{{ getScheduleField(t.id, 'lateStart') }}</td>
          <td>{{ getScheduleField(t.id, 'lateFinish') }}</td>
          <td>{{ getScheduleSlack(t.id) }}</td>
          <td>
            <div class="flex items-center gap-2">
              <input
                type="number"
                v-model.number="t.percentComplete"
                @change="updateTaskStatus(t)"
                min="0"
                max="100"
                class="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="text-sm text-gray-500">%</span>
            </div>
          </td>
          <td>
            <PMButton variant="secondary" type="button" @click="updateTaskStatus(t)">更新</PMButton>
          </td>
        </tr>
      </tbody>
          </table>
          <div v-else class="text-sm text-gray-500">暂无任务</div>
        </div>
      </div>
    </PMCard>

    <!-- Mermaid 渲染容器 -->
    <div class="mt-6 flex items-center gap-3">
      <h3 class="text-lg font-semibold text-gray-900">流程图</h3>
      <label class="inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" v-model="showFlowchart" />
        显示
      </label>
    </div>
    <div v-show="showFlowchart" id="wbs-graph" class="mt-3"></div>

    <!-- 转派处理人模态框（MVP：从项目成员中多选） -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssign">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>转派处理人 - {{ assignTask?.name }}</h3>
          <button @click="closeAssign" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p v-if="assignError" class="error">{{ assignError }}</p>
          <div v-if="projectMembers.length === 0">项目暂无成员，请先在“项目成员管理”里添加。</div>
          <div v-else>
            <label>选择处理人（可多选）</label>
            <select
              v-model="selectedAssigneeIds"
              multiple
              size="6"
              class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="m in projectMembers" :key="m.id" :value="m.id">
                {{ m.username }} (id={{ m.id }})
              </option>
            </select>
            <div class="mt-3 flex gap-2 justify-end">
              <PMButton variant="secondary" type="button" @click="closeAssign">取消</PMButton>
              <PMButton variant="primary" type="button" :disabled="!assignTask" @click="submitAssignees">
                保存
              </PMButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 甘特图预览模态框 -->
    <div v-if="showGanttPreview" class="modal-overlay" @click="showGanttPreview = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>甘特图预览</h3>
          <button @click="showGanttPreview = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="ganttLoading" class="loading">加载中...</div>
          <div v-else-if="ganttError" class="error">{{ ganttError }}</div>
          <div v-else class="gantt-preview">
            <div class="gantt-toolbar">
              <PMButton variant="secondary" type="button" @click="exportGanttChart">下载 PNG</PMButton>
              <PMButton variant="secondary" type="button" @click="exportGanttSvg">下载 SVG</PMButton>
            </div>
            <div ref="ganttChartRef" class="gantt-chart"></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProject, updateProjectStartDate, exportGantt, getGanttData, getProjectRepo, updateProjectRepo } from '@/api/project';
import { getWbsItems, createWbsItem, updateWbsItem } from '@/api/wbs-item';
import type { WbsItemDto } from '@/api/wbs-item';
import { getTasksByProject, createTask, updateTask } from '@/api/task';
import type { TaskDto } from '@/api/task';
import { setTaskAssignees } from '@/api/task';
import { getProjectMembers } from '@/api/project';
import mermaid from 'mermaid';
// 从默认导出中获取 mermaidAPI
// const { mermaidAPI } = mermaid;
import { createDependency } from '@/api/dependency';
import { computeSchedule } from '@/api/schedule';
import { formatBeijingDateTime } from '@/utils/datetime';
import PMButton from '@/components/pm/PMButton.vue';
import PMCard from '@/components/pm/PMCard.vue';
import PMFormField from '@/components/pm/PMFormField.vue';
import PMInput from '@/components/pm/PMInput.vue';

interface ProjectDetail {
  id: number;
  name: string;
  description?: string;
  role?: string;
  startDate?: string;
}

const route = useRoute();
const router = useRouter();
const projectId = computed(() => Number(route.params.id));
const project = ref<ProjectDetail>({ id: 0, name: '', description: '' });
const error = ref<string>('');

const isAdmin = computed(() => project.value.role === 'admin');

function goToMembers() {
  router.push(`/projects/${projectId.value}/members`);
}

// Git repo binding
const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;
const repoSaving = ref(false);
const repoError = ref('');
const repoForm = ref({ repoUrl: '', repoProvider: 'gitlab', repoDefaultBranch: '', gitSyncEnabled: false });
const repoInfo = ref<{ webhookPath: string; webhookToken: string; lastGitEventAt: string | null }>({ webhookPath: '', webhookToken: '', lastGitEventAt: null });

async function reloadRepo() {
  repoError.value = '';
  try {
    const res = await getProjectRepo(projectId.value);
    const data = res.data;
    repoForm.value = {
      repoUrl: data.repoUrl ?? '',
      repoProvider: data.repoProvider ?? 'generic',
      repoDefaultBranch: data.repoDefaultBranch ?? '',
      gitSyncEnabled: !!data.gitSyncEnabled,
    };
    repoInfo.value = { webhookPath: data.webhookPath, webhookToken: data.webhookToken, lastGitEventAt: data.lastGitEventAt ?? null };
  } catch (e: any) {
    console.error('加载 Git 联动配置失败', e);
    repoError.value = e?.response?.data?.message || '加载 Git 联动配置失败';
  }
}

async function saveRepo() {
  repoError.value = '';
  repoSaving.value = true;
  try {
    const res = await updateProjectRepo(projectId.value, {
      repoUrl: repoForm.value.repoUrl,
      repoProvider: repoForm.value.repoProvider,
      repoDefaultBranch: repoForm.value.repoDefaultBranch,
      gitSyncEnabled: repoForm.value.gitSyncEnabled,
    });
    const data = res.data;
    repoInfo.value = { webhookPath: data.webhookPath, webhookToken: data.webhookToken, lastGitEventAt: data.lastGitEventAt ?? null };
  } catch (e: any) {
    console.error('保存 Git 联动配置失败', e);
    repoError.value = e?.response?.data?.message || '保存 Git 联动配置失败';
  } finally {
    repoSaving.value = false;
  }
}

async function rotateRepoToken() {
  repoError.value = '';
  repoSaving.value = true;
  try {
    const res = await updateProjectRepo(projectId.value, { rotateWebhookSecret: true });
    repoInfo.value = { webhookPath: res.data.webhookPath, webhookToken: res.data.webhookToken, lastGitEventAt: res.data.lastGitEventAt ?? null };
  } catch (e: any) {
    console.error('轮换 Token 失败', e);
    repoError.value = e?.response?.data?.message || '轮换 Token 失败';
  } finally {
    repoSaving.value = false;
  }
}

// WBS
const wbsItems = ref<WbsItemDto[]>([]);
const showForm = ref(false);
const newItem = ref({ name: '', description: '', duration: 1 });
const wbsError = ref<string>('');
// 任务相关
const tasks = ref<TaskDto[]>([]);
const taskError = ref<string>('');
// 新建任务表单控制
const showTaskForm = ref(false);
// 默认选中第一个WBS
const newTask = ref({ wbsItemId: 0, name: '', duration: 1 });
// Mermaid 图定义字符串
const graphDef = ref<string>('');
// 日期计算相关
const projectStartDate = ref<string>('');
const projectEndDate = ref<string>('');
const wbsStartDates = ref<Record<number, string>>({});
// 甘特图相关
const showGanttPreview = ref(false);
const ganttLoading = ref(false);
const ganttError = ref<string>('');
const ganttData = ref<any[]>([]);
const ganttChartRef = ref<HTMLDivElement | null>(null);
const criticalTaskIds = ref<Set<number>>(new Set());
const scheduleLoading = ref(false);
const scheduleError = ref('');
const scheduleByTaskId = ref<Record<number, { earlyStart?: string; earlyFinish?: string; lateStart?: string; lateFinish?: string; slack?: number }>>({});
const scheduleSummary = ref('');

// 项目成员 & 转派
const projectMembers = ref<Array<{ id: number; username: string; role: 'admin' | 'member' }>>([]);
const showAssignModal = ref(false);
const assignTask = ref<TaskDto | null>(null);
const selectedAssigneeIds = ref<number[]>([]);
const assignError = ref('');

// 流程图显示开关（MVP：仅控制渲染/展示）
const showFlowchart = ref(true);

// 后继依赖创建表单
const baseTaskId = ref(0);
const succIds = ref<number[]>([]);
const depError = ref<string>('');

// 计算允许作为后继的任务列表
const allowedSuccessors = computed(() => {
  if (!baseTaskId.value) return [];
  const visited = new Set<number>();
  const queue: number[] = [baseTaskId.value];
  while (queue.length) {
    const id = queue.shift()!;
    // 找到所有前置为id的任务
    tasks.value.forEach(t => {
      t.predecessors?.forEach(dep => {
        if (dep.predecessor?.id === id && !visited.has(t.id)) {
          visited.add(t.id);
          queue.push(t.id);
        }
      });
    });
  }
  return tasks.value.filter(t => t.id !== baseTaskId.value && !visited.has(t.id));
});

async function submitDependency() {
  depError.value = '';
  if (!baseTaskId.value || succIds.value.length === 0) {
    depError.value = '请先选择基准任务及至少一个后继任务';
    return;
  }
  try {
    for (const succId of succIds.value) {
      await createDependency({ taskId: succId, predecessorId: baseTaskId.value });
    }
    await loadTasks();
    baseTaskId.value = 0;
    succIds.value = [];
  } catch (e) {
    console.error('创建后继依赖失败', e);
    depError.value = '创建后继依赖失败';
  }
}

async function loadWbs() {
  try {
    const res = await getWbsItems(projectId.value);
    wbsItems.value = res.data;
    // 排序 WBS
    wbsItems.value.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    // 默认选中首个WBS
    newTask.value.wbsItemId = wbsItems.value[0]?.id ?? 0;
  } catch (e) {
    console.error('加载 WBS 失败', e);
  }
}
// 加载任务列表
async function loadTasks() {
  try {
    const res = await getTasksByProject(projectId.value);
    tasks.value = res.data;
  } catch (e) {
    console.error('加载任务失败', e);
    taskError.value = '加载任务失败';
  }
}

async function loadProjectMembers() {
  if (!isAdmin.value) return;
  try {
    const res = await getProjectMembers(projectId.value);
    projectMembers.value = res.data || [];
  } catch (e) {
    console.error('加载项目成员失败', e);
  }
}

function getAssigneeNames(t: TaskDto) {
  const rows = t.assignees ?? [];
  return rows
    .map((a) => a?.user?.username)
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
}

function openAssign(t: TaskDto) {
  assignError.value = '';
  assignTask.value = t;
  selectedAssigneeIds.value = (t.assignees ?? []).map((a) => a.userId).filter((n) => typeof n === 'number');
  showAssignModal.value = true;
  loadProjectMembers().catch(() => void 0);
}

function closeAssign() {
  showAssignModal.value = false;
  assignTask.value = null;
  selectedAssigneeIds.value = [];
  assignError.value = '';
}

async function submitAssignees() {
  if (!assignTask.value) return;
  assignError.value = '';
  try {
    await setTaskAssignees(assignTask.value.id, selectedAssigneeIds.value);
    await loadTasks();
    closeAssign();
  } catch (e: any) {
    console.error('转派失败', e);
    assignError.value = e?.response?.data?.message || '转派失败';
  }
}

async function submitWbs() {
  wbsError.value = '';
  try {
    const dto = { projectId: projectId.value, ...newItem.value };
    const res = await createWbsItem(dto);
    wbsItems.value.push(res.data);
    // 重新加载 WBS 并排序
    await loadWbs();
    showForm.value = false;
    newItem.value = { name: '', description: '', duration: 1 };
  } catch (e) {
    console.error('创建 WBS 失败', e);
    wbsError.value = '创建失败，请重试';
  }
}

async function updateWbsSeq(item: WbsItemDto) {
  try {
    await updateWbsItem(item.id, { seq: item.seq });
    await loadWbs();
  } catch (e) {
    console.error('更新WBS顺序失败', e);
  }
}

// 新建任务表单提交
async function submitTask() {
  taskError.value = '';
  try {
    await createTask({
      wbsItemId: newTask.value.wbsItemId,
      name: newTask.value.name,
      duration: newTask.value.duration,
    });
    showTaskForm.value = false;
    newTask.value = { wbsItemId: 0, name: '', duration: 1 };
    await loadTasks();
  } catch (e) {
    console.error('创建任务失败', e);
    taskError.value = '创建任务失败';
  }
}

// 更新任务状态
async function updateTaskStatus(t: TaskDto) {
  try {
    await updateTask(t.id, { percentComplete: t.percentComplete });
  } catch (e) {
    console.error('更新任务失败', e);
    taskError.value = '更新任务失败';
  }
}

// 计算项目日期（关键路径算法）
async function calculateDates() {
  if (!projectStartDate.value) return;
  
  // 保存开始日期到后端
  try {
    await updateProjectStartDate(projectId.value, projectStartDate.value);
    project.value.startDate = projectStartDate.value;
  } catch (e) {
    console.error('保存开始日期失败', e);
    return;
  }
  
  const startDate = new Date(projectStartDate.value);
  const taskES = new Map<number, Date>(); // 最早开始时间
  const taskEF = new Map<number, Date>(); // 最早完成时间
  
  // 初始化所有任务的 ES 为开始日期
  tasks.value.forEach(t => {
    taskES.set(t.id, new Date(startDate));
  });
  
  // 拓扑排序计算 ES 和 EF
  const inDegree = new Map<number, number>();
  tasks.value.forEach(t => {
    inDegree.set(t.id, t.predecessors?.length ?? 0);
  });
  
  const queue: number[] = [];
  tasks.value.forEach(t => {
    if (inDegree.get(t.id) === 0) {
      queue.push(t.id);
    }
  });
  
  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const task = tasks.value.find(t => t.id === taskId);
    if (!task) continue;
    
    // 计算当前任务的 ES（取所有前置任务 EF 的最大值）
    let maxEF = new Date(startDate);
    task.predecessors?.forEach(dep => {
      const preEF = taskEF.get(dep.predecessor.id);
      if (preEF && preEF > maxEF) {
        maxEF = preEF;
      }
    });
    taskES.set(taskId, maxEF);
    
    // 计算当前任务的 EF
    const duration = task.duration ?? 0;
    const ef = new Date(maxEF);
    ef.setDate(ef.getDate() + duration);
    taskEF.set(taskId, ef);
    
    // 更新后继任务的入度（使用 successors 关系）
    task.successors?.forEach(dep => {
      const succId = dep.task?.id;
      if (succId) {
        const deg = inDegree.get(succId) ?? 0;
        inDegree.set(succId, deg - 1);
        if (inDegree.get(succId) === 0) {
          queue.push(succId);
        }
      }
    });
  }
  
  // 计算项目完成时间（所有任务 EF 的最大值）
  let maxProjectEF = new Date(startDate);
  taskEF.forEach(ef => {
    if (ef > maxProjectEF) {
      maxProjectEF = ef;
    }
  });
  projectEndDate.value = maxProjectEF.toISOString().slice(0, 10);

  // 将计算得到的任务开始/结束日期写回后端，供甘特图预览/导出使用
  try {
    await Promise.all(
      tasks.value.map(async (t) => {
        const es = taskES.get(t.id);
        const ef = taskEF.get(t.id);
        if (!es || !ef) return;
        const start = es.toISOString().slice(0, 10);
        const end = ef.toISOString().slice(0, 10);
        // 同步本地
        t.startDate = start;
        t.endDate = end;
        await updateTask(t.id, { startDate: start, endDate: end });
      }),
    );
  } catch (e) {
    console.error('写回任务日期失败', e);
  }
  
  // 计算每个 WBS 节点的最早开始时间和持续时间
  wbsStartDates.value = {};
  for (const wbs of wbsItems.value) {
    const wbsTasks = tasks.value.filter(t => t.wbsItemId === wbs.id);
    if (wbsTasks.length > 0) {
      // 计算最早开始时间（ES 的最小值）
      const firstTaskId = wbsTasks[0]?.id;
      if (!firstTaskId) continue;
      const firstES = taskES.get(firstTaskId);
      const firstEF = taskEF.get(firstTaskId);
      if (!firstES || !firstEF) continue;
      let minES = firstES;
      // 计算最晚完成时间（EF 的最大值）
      let maxEF = firstEF;
      
      wbsTasks.forEach(t => {
        const es = taskES.get(t.id);
        const ef = taskEF.get(t.id);
        if (es && es < minES) {
          minES = es;
        }
        if (ef && ef > maxEF) {
          maxEF = ef;
        }
      });
      
      wbsStartDates.value[wbs.id] = minES.toISOString().slice(0, 10);
      
      // 计算持续时间（天数）= 最晚完成时间 - 最早开始时间
      const duration = Math.ceil((maxEF.getTime() - minES.getTime()) / (1000 * 60 * 60 * 24));
      
      // 更新 WBS 节点的持续时间
      if (wbs.duration !== duration) {
        try {
          await updateWbsItem(wbs.id, { duration });
          wbs.duration = duration;
        } catch (e) {
          console.error(`更新 WBS ${wbs.id} 持续时间失败`, e);
        }
      }
    }
  }
}

function sanitizeMermaidText(input: string) {
  return (input ?? '')
    .toString()
    .replace(/[\r\n]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/:/g, '：')
    .trim();
}

function isValidDateStr(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isCriticalTask(taskId: number) {
  return criticalTaskIds.value.has(taskId);
}

function getScheduleField(
  taskId: number,
  field: 'earlyStart' | 'earlyFinish' | 'lateStart' | 'lateFinish',
) {
  const v = scheduleByTaskId.value?.[taskId]?.[field];
  return v && v !== '-' ? v : '-';
}

function getScheduleSlack(taskId: number) {
  const v = scheduleByTaskId.value?.[taskId]?.slack;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '-';
}

async function runCriticalPathAnalysis() {
  scheduleError.value = '';
  scheduleSummary.value = '';
  scheduleLoading.value = true;
  try {
    const runRes = await computeSchedule(projectId.value, 'initial');
    const items = runRes.data?.items ?? [];

    const byTask: Record<number, { earlyStart?: string; earlyFinish?: string; lateStart?: string; lateFinish?: string; slack?: number }> = {};
    const crit = new Set<number>();

    items.forEach((it: any) => {
      const taskId = it?.task?.id;
      if (typeof taskId !== 'number') return;
      byTask[taskId] = {
        earlyStart: it?.earlyStart ?? '-',
        earlyFinish: it?.earlyFinish ?? '-',
        lateStart: it?.lateStart ?? '-',
        lateFinish: it?.lateFinish ?? '-',
        slack: typeof it?.slack === 'number' ? it.slack : Number(it?.slack),
      };
      if (Number(it?.slack) === 0) crit.add(taskId);
    });

    scheduleByTaskId.value = byTask;
    criticalTaskIds.value = crit;
    scheduleSummary.value = `关键任务：${crit.size} / ${tasks.value.length}`;
  } catch (e: any) {
    console.error('关键路径分析失败', e);
    scheduleError.value = e?.response?.data?.message || '关键路径分析失败（请确认已设置项目开始日期、任务工期与依赖关系）';
    scheduleByTaskId.value = {};
    criticalTaskIds.value = new Set();
  } finally {
    scheduleLoading.value = false;
  }
}

function diffDays(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function computeScheduleFallback() {
  // 当接口数据没有 start/end 时，尝试使用项目开始日期 + 依赖 + duration 计算
  if (!projectStartDate.value) return new Map<number, { start: string; end: string; duration: number }>();
  const startDate = new Date(projectStartDate.value);
  const taskES = new Map<number, Date>();
  const taskEF = new Map<number, Date>();

  tasks.value.forEach((t) => taskES.set(t.id, new Date(startDate)));

  const inDegree = new Map<number, number>();
  tasks.value.forEach((t) => inDegree.set(t.id, t.predecessors?.length ?? 0));

  const queue: number[] = [];
  tasks.value.forEach((t) => {
    if ((inDegree.get(t.id) ?? 0) === 0) queue.push(t.id);
  });

  while (queue.length) {
    const taskId = queue.shift()!;
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) continue;

    let maxEF = new Date(startDate);
    task.predecessors?.forEach((dep) => {
      const preId = dep.predecessor?.id;
      if (!preId) return;
      const preEF = taskEF.get(preId);
      if (preEF && preEF > maxEF) maxEF = preEF;
    });

    taskES.set(taskId, maxEF);
    const duration = task.duration ?? 0;
    const ef = new Date(maxEF);
    ef.setDate(ef.getDate() + duration);
    taskEF.set(taskId, ef);

    task.successors?.forEach((dep) => {
      const succId = dep.task?.id;
      if (!succId) return;
      const deg = inDegree.get(succId) ?? 0;
      inDegree.set(succId, deg - 1);
      if ((inDegree.get(succId) ?? 0) === 0) queue.push(succId);
    });
  }

  const result = new Map<number, { start: string; end: string; duration: number }>();
  tasks.value.forEach((t) => {
    const es = taskES.get(t.id);
    const ef = taskEF.get(t.id);
    if (!es || !ef) return;
    const s = es.toISOString().slice(0, 10);
    const e = ef.toISOString().slice(0, 10);
    result.set(t.id, { start: s, end: e, duration: t.duration ?? diffDays(s, e) });
  });
  return result;
}

function buildMermaidGanttDef(): { def: string; taskCount: number } {
  const title = sanitizeMermaidText(project.value?.name ? `项目「${project.value.name}」甘特图` : '项目甘特图');
  const lines: string[] = [];
  let taskCount = 0;
  lines.push('gantt');
  lines.push(`  title ${title}`);
  lines.push('  dateFormat  YYYY-MM-DD');
  lines.push('  axisFormat  %Y-%m-%d');

  const fallbackSchedule = computeScheduleFallback();

  // 按 WBS seq 排序，以 section 展示
  const wbsOrder = [...wbsItems.value].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const itemsByWbsId = new Map<number, any[]>();
  wbsOrder.forEach((w) => itemsByWbsId.set(w.id, []));

  // 将 ganttData 归入 WBS（接口返回 wbsName；我们用 tasks 里的 wbsItemId 做更稳的分组）
  const ganttById = new Map<number, any>();
  (ganttData.value ?? []).forEach((it) => {
    if (it?.id != null) ganttById.set(Number(it.id), it);
  });

  tasks.value.forEach((t) => {
    const bucket = itemsByWbsId.get(t.wbsItemId) ?? [];
    const apiItem = ganttById.get(t.id);
    bucket.push(apiItem ?? t);
    itemsByWbsId.set(t.wbsItemId, bucket);
  });

  // 如果没有 WBS（或没有任务），按接口数据兜底
  if (wbsOrder.length === 0) {
    const sectionName = '任务';
    lines.push(`  section ${sanitizeMermaidText(sectionName)}`);
    (ganttData.value ?? []).forEach((it: any) => {
      const id = Number(it?.id);
      const name = sanitizeMermaidText(it?.taskName ?? `任务${id}`);
      const rawStart = it?.startDate && it.startDate !== '-' ? it.startDate : fallbackSchedule.get(id)?.start;
      const rawEnd = it?.endDate && it.endDate !== '-' ? it.endDate : fallbackSchedule.get(id)?.end;
      const start = isValidDateStr(rawStart) ? rawStart : undefined;
      const end = isValidDateStr(rawEnd) ? rawEnd : undefined;
      const duration = it?.duration ?? fallbackSchedule.get(id)?.duration ?? (start && end ? diffDays(start, end) : 0);
      if (!start) return;
      const statusTag = (it?.percentComplete ?? 0) >= 100 ? 'done,' : (it?.percentComplete ?? 0) > 0 ? 'active,' : '';
      const critTag = criticalTaskIds.value.has(id) ? 'crit,' : '';
      const dur = Math.max(1, Number(duration) || 1);
      lines.push(`  ${name} :${critTag}${statusTag}t${id}, ${start}, ${dur}d`);
      taskCount += 1;
    });
    return { def: lines.join('\n'), taskCount };
  }

  wbsOrder.forEach((w) => {
    const sectionTitle = sanitizeMermaidText(w.name);
    lines.push(`  section ${sectionTitle}`);
    const items = itemsByWbsId.get(w.id) ?? [];
    // 排序：有 start 的在前，按 start 升序
    items.sort((a, b) => {
      const as = a?.startDate && a.startDate !== '-' ? a.startDate : (fallbackSchedule.get(Number(a?.id))?.start ?? '9999-12-31');
      const bs = b?.startDate && b.startDate !== '-' ? b.startDate : (fallbackSchedule.get(Number(b?.id))?.start ?? '9999-12-31');
      return as.localeCompare(bs);
    });
    items.forEach((it: any) => {
      const id = Number(it?.id);
      const name = sanitizeMermaidText(it?.taskName ?? it?.name ?? `任务${id}`);
      const rawStart = it?.startDate && it.startDate !== '-' ? it.startDate : fallbackSchedule.get(id)?.start;
      const rawEnd = it?.endDate && it.endDate !== '-' ? it.endDate : fallbackSchedule.get(id)?.end;
      const start = isValidDateStr(rawStart) ? rawStart : undefined;
      const end = isValidDateStr(rawEnd) ? rawEnd : undefined;
      const duration = it?.duration ?? fallbackSchedule.get(id)?.duration ?? (start && end ? diffDays(start, end) : 0);
      if (!start) return;
      const percent = Number(it?.percentComplete ?? 0);
      const statusTag = percent >= 100 ? 'done,' : percent > 0 ? 'active,' : '';
      const critTag = criticalTaskIds.value.has(id) ? 'crit,' : '';
      const dur = Math.max(1, Number(duration) || 1);
      lines.push(`  ${name} :${critTag}${statusTag}t${id}, ${start}, ${dur}d`);
      taskCount += 1;
    });
  });

  return { def: lines.join('\n'), taskCount };
}

async function renderGanttChart() {
  const container = ganttChartRef.value;
  if (!container) return;

  // 没有任何任务时直接提示
  if ((tasks.value?.length ?? 0) === 0 && (ganttData.value?.length ?? 0) === 0) {
    container.textContent = '暂无任务数据，无法生成甘特图。';
    return;
  }

  const { def, taskCount } = buildMermaidGanttDef();
  if (taskCount === 0) {
    container.textContent = '没有任何带有效日期（YYYY-MM-DD）的任务，无法生成甘特图。请先设置项目开始日期并计算日期，或为任务补齐开始/结束日期。';
    return;
  }
  try {
    const { svg } = await mermaid.render('gantt-' + Date.now(), def);
    container.innerHTML = svg;
  } catch (e) {
    console.error('甘特图 Mermaid 渲染失败', e);
    container.textContent = def;
    throw e;
  }
}

// 预览甘特图
async function previewGantt() {
  showGanttPreview.value = true;
  ganttLoading.value = true;
  ganttError.value = '';
  try {
    // 尝试刷新关键路径（不阻断预览）
    if (!scheduleLoading.value && tasks.value.length > 0) {
      runCriticalPathAnalysis().catch(() => void 0);
    }

    const res = await getGanttData(projectId.value);
    ganttData.value = res.data || [];
  } catch (e: any) {
    console.error('加载甘特图数据失败', e);
    ganttError.value = e.response?.data?.message || '加载甘特图数据失败';
    // 如果后端接口不存在，使用前端数据生成预览
    if (e.response?.status === 404) {
      ganttData.value = tasks.value.map(t => {
        const wbs = wbsItems.value.find(w => w.id === t.wbsItemId);
        return {
          id: t.id,
          taskName: t.name,
          wbsName: wbs?.name || '-',
          startDate: t.startDate || '-',
          endDate: t.endDate || '-',
          duration: t.duration || 0,
          percentComplete: t.percentComplete || 0,
        };
      });
      ganttError.value = '';
    }
  } finally {
    ganttLoading.value = false;
  }

  // 渲染甘特图（SVG）
  if (!ganttError.value) {
    await nextTick();
    try {
      await renderGanttChart();
    } catch {
      ganttError.value = '甘特图渲染失败（请检查任务日期/工期是否完整）';
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getRenderedGanttSvgElement() {
  const container = ganttChartRef.value;
  if (!container) return null;
  return container.querySelector('svg');
}

// 导出甘特图（SVG）
async function exportGanttSvg() {
  try {
    if (!showGanttPreview.value) {
      // 未打开预览时也生成一次，确保有 SVG 可导出
      await previewGantt();
    }
    const svgEl = getRenderedGanttSvgElement();
    if (!svgEl) {
      alert('当前没有可导出的甘特图（请先预览）。');
      return;
    }
    const svgText = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `project_${projectId.value}_gantt.svg`);
  } catch (e: any) {
    console.error('导出甘特图（SVG）失败', e);
    alert('导出甘特图（SVG）失败');
  }
}

// 导出甘特图（PNG）
async function exportGanttChart() {
  try {
    if (!showGanttPreview.value) {
      await previewGantt();
    }
    const svgEl = getRenderedGanttSvgElement();
    if (!svgEl) {
      alert('当前没有可导出的甘特图（请先预览）。');
      return;
    }
    // 确保 xmlns 存在，便于转图片
    if (!svgEl.getAttribute('xmlns')) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    const svgText = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    const pngBlob: Blob | null = await new Promise((resolve) => {
      img.onload = () => {
        const width = Math.ceil(img.width || (svgEl.viewBox?.baseVal?.width ?? 1200));
        const height = Math.ceil(img.height || (svgEl.viewBox?.baseVal?.height ?? 600));
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        // 白底
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => resolve(b), 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = svgUrl;
    });

    URL.revokeObjectURL(svgUrl);

    if (!pngBlob) {
      // PNG 转换失败时，退化为 SVG 导出
      await exportGanttSvg();
      return;
    }
    downloadBlob(pngBlob, `project_${projectId.value}_gantt.png`);
  } catch (e: any) {
    console.error('导出甘特图（PNG）失败', e);
    alert('导出甘特图失败');
  }
}

// 导出甘特表（Excel，保留旧逻辑）
async function exportGanttTableExcel() {
  try {
    const res = await exportGantt(projectId.value);
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `project_${projectId.value}_gantt.xlsx`);
  } catch (e: any) {
    console.error('导出甘特表（Excel）失败', e);
    alert(e.response?.data?.message || '导出甘特表失败');
  }
}

// 初始化加载项目、WBS、任务，并渲染 Mermaid 图
onMounted(async () => {
  try {
    const res = await getProject(projectId.value);
    project.value = res.data;
    if (project.value.startDate) {
      projectStartDate.value = project.value.startDate;
    }
    await loadWbs();
    await loadTasks();
    await loadProjectMembers();
    if (isAdmin.value) {
      await reloadRepo();
    }
    mermaid.initialize({ startOnLoad: false });
    // 有任务时，自动跑一次关键路径分析以填充任务列表列（不阻断页面）
    if (tasks.value.length > 0) {
      runCriticalPathAnalysis().catch(() => void 0);
    }
  } catch (e) {
    console.error('加载项目详情失败', e);
    error.value = '加载项目失败';
  }
});

function toLinkableId(n: number) {
  return Number.isFinite(n) ? String(n) : '0';
}

function getTaskDisplayName(t: TaskDto) {
  const pct = Math.round(Number(t.percentComplete ?? 0));
  return sanitizeMermaidText(`#${t.id} ${t.name} (${pct}%)`);
}

function getES(taskId: number) {
  const v = scheduleByTaskId.value?.[taskId]?.earlyStart;
  return isValidDateStr(v) ? v : undefined;
}

function getEF(taskId: number) {
  const v = scheduleByTaskId.value?.[taskId]?.earlyFinish;
  return isValidDateStr(v) ? v : undefined;
}

function isCriticalEdge(preId: number, succId: number) {
  // 关键路径边：两端任务均 slack=0，且 EF(pre) == ES(succ)（无浮动连接）
  if (!criticalTaskIds.value.has(preId) || !criticalTaskIds.value.has(succId)) return false;
  const ef = getEF(preId);
  const es = getES(succId);
  if (!ef || !es) return false;
  return ef === es;
}

// 监听 WBS、任务、关键路径结果变化，生成 Mermaid 图并渲染为 SVG（Gate 方案）
watch([wbsItems, tasks, scheduleByTaskId, criticalTaskIds, showFlowchart], async () => {
  const container = document.getElementById('wbs-graph');
  if (!showFlowchart.value) {
    if (container) container.innerHTML = '';
    return;
  }
  const lines: string[] = [];
  let linkIndex = 0;
  const criticalLinkIndexes: number[] = [];

  const addLink = (from: string, to: string) => {
    lines.push(`  ${from} --> ${to}`);
    const idx = linkIndex;
    linkIndex += 1;
    return idx;
  };

  // Gate 方案更适合横向排版：里程碑从左到右，里程碑内任务纵向排
  lines.push('flowchart LR');
  lines.push('  %% 默认连线（非关键）置灰，避免信息混在一起');
  lines.push('  linkStyle default stroke:#bfbfbf,stroke-width:1px;');
  lines.push('  %% 节点样式');
  lines.push('  classDef milestone fill:#fff7e6,stroke:#ffa940,stroke-width:2px,color:#000;');
  lines.push('  classDef gate fill:#f6ffed,stroke:#52c41a,stroke-width:2px,color:#000;');
  lines.push('  classDef critical fill:#fff1f0,stroke:#cf1322,stroke-width:2px,color:#000;');

  const sortedWbs = [...wbsItems.value].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  // 快速索引：taskId -> wbsId
  const taskToWbs = new Map<number, number>();
  tasks.value.forEach((t) => taskToWbs.set(t.id, t.wbsItemId));

  // 节点：里程碑 M + Gate G（Gate 用于收敛“完成”）
  sortedWbs.forEach((w) => {
    const wid = toLinkableId(w.id);
    const title = sanitizeMermaidText(w.name);
    lines.push(`  M${wid}["里程碑：${title}"]`);
    lines.push(`  class M${wid} milestone`);
    lines.push(`  G${wid}((完成 Gate))`);
    lines.push(`  class G${wid} gate`);
  });

  // 每个里程碑的任务子图
  const tasksByWbs = new Map<number, TaskDto[]>();
  sortedWbs.forEach((w) => tasksByWbs.set(w.id, []));
  tasks.value.forEach((t) => {
    const bucket = tasksByWbs.get(t.wbsItemId);
    if (bucket) bucket.push(t);
  });

  sortedWbs.forEach((w) => {
    const wid = toLinkableId(w.id);
    const wTitle = sanitizeMermaidText(w.name);
    lines.push(`  subgraph WBS_${wid}["${wTitle}"]`);
    lines.push('    direction TB');

    const wTasks = (tasksByWbs.get(w.id) ?? [])
      .slice()
      .sort((a, b) => {
        const as = getES(a.id) ?? '9999-12-31';
        const bs = getES(b.id) ?? '9999-12-31';
        const cmp = as.localeCompare(bs);
        if (cmp !== 0) return cmp;
        return a.id - b.id;
      });

    wTasks.forEach((t) => {
      const tid = toLinkableId(t.id);
      lines.push(`    T${tid}["${getTaskDisplayName(t)}"]`);
      if (criticalTaskIds.value.has(t.id)) {
        lines.push(`    class T${tid} critical`);
      }
    });

    lines.push('  end');
    // 避免 subgraph 默认主题产生“蓝框/蓝标题”歧义：显式设为中性浅灰
    lines.push(`  style WBS_${wid} fill:#ffffff,stroke:#e5e7eb,stroke-width:1px;`);

    // 入口任务：在该里程碑内没有前置任务（只看同里程碑依赖）
    const hasPreInSame = new Map<number, boolean>();
    wTasks.forEach((t) => hasPreInSame.set(t.id, false));
    wTasks.forEach((t) => {
      t.predecessors?.forEach((dep) => {
        const preId = dep.predecessor?.id;
        if (!preId) return;
        if (taskToWbs.get(preId) === w.id) {
          hasPreInSame.set(t.id, true);
        }
      });
    });
    const entryTasks = wTasks.filter((t) => !hasPreInSame.get(t.id));
    entryTasks.forEach((t) => {
      addLink(`M${wid}`, `T${toLinkableId(t.id)}`);
    });

    // 叶子任务：在该里程碑内没有后续任务（只看同里程碑 successors）
    const hasSuccInSame = new Map<number, boolean>();
    wTasks.forEach((t) => hasSuccInSame.set(t.id, false));
    wTasks.forEach((t) => {
      t.successors?.forEach((dep) => {
        const succId = dep.task?.id;
        if (!succId) return;
        if (taskToWbs.get(succId) === w.id) {
          hasSuccInSame.set(t.id, true);
        }
      });
    });
    const leafTasks = wTasks.filter((t) => !hasSuccInSame.get(t.id));
    leafTasks.forEach((t) => {
      addLink(`T${toLinkableId(t.id)}`, `G${wid}`);
    });
  });

  // Gate 链路：G_i -> M_{i+1}（最后一个 Gate -> End）
  if (sortedWbs.length > 0) {
    lines.push('  End((结束))');
    for (let i = 0; i < sortedWbs.length; i++) {
      const cur = sortedWbs[i];
      const nxt = sortedWbs[i + 1];
      if (!cur) continue;
      const curId = toLinkableId(cur.id);
      if (nxt) {
        addLink(`G${curId}`, `M${toLinkableId(nxt.id)}`);
      } else {
        addLink(`G${curId}`, 'End');
      }
    }
  }

  // 依赖边：前置任务 -> 当前任务，并高亮关键路径边
  tasks.value.forEach((t) => {
    const succId = t.id;
    t.predecessors?.forEach((dep) => {
      const preId = dep.predecessor?.id;
      if (!preId) return;
      const idx = addLink(`T${toLinkableId(preId)}`, `T${toLinkableId(succId)}`);
      if (isCriticalEdge(preId, succId)) {
        criticalLinkIndexes.push(idx);
      }
    });
  });

  // 关键路径箭头染色（红色加粗，覆盖默认灰色）
  if (criticalLinkIndexes.length) {
    lines.push('  %% 关键路径连线样式');
    criticalLinkIndexes.forEach((idx) => {
      lines.push(`  linkStyle ${idx} stroke:#cf1322,stroke-width:2.5px;`);
    });
  }

  const graph = lines.join('\n') + '\n';
  graphDef.value = graph;
  await nextTick();
  if (!container) return;
  try {
    const { svg } = await mermaid.render('wbs-graph-' + Date.now(), graph);
    container.innerHTML = svg;
  } catch (e) {
    console.error('Mermaid 渲染失败', e);
    container.textContent = graph;
  }
}, { immediate: true });
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
.wbs-form {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
}
.wbs-form div {
  margin-bottom: 10px;
}
.task-form {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
}
.task-form div {
  margin-bottom: 10px;
}
.dependency-form {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
}
.dependency-form div {
  margin-bottom: 10px;
}
.gantt-actions {
  margin-top: 20px;
  margin-bottom: 20px;
}
.gantt-actions button {
  margin-right: 10px;
}
.project-date-form {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}
.project-date-form label {
  display: inline-block;
  margin-right: 10px;
}
.project-date-form input[type="date"] {
  margin-right: 10px;
}
.date-result {
  margin-top: 10px;
  font-weight: bold;
  color: #42b983;
}
.wbs-date {
  margin-left: 10px;
  color: #666;
  font-size: 0.9em;
}
/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}
.close-btn:hover {
  color: #000;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
.gantt-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.gantt-chart {
  width: 100%;
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
}
.gantt-chart :deep(svg) {
  max-width: none; /* 允许横向滚动显示完整时间轴 */
}
.schedule-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}
.schedule-summary {
  color: #666;
  font-size: 0.9em;
}
.critical-badge {
  display: inline-block;
  padding: 2px 6px;
  margin-right: 6px;
  border-radius: 10px;
  font-size: 12px;
  background: #ffe8e8;
  color: #b10000;
  border: 1px solid #ffb3b3;
}
.task-table tr.critical td {
  background: #fff6f6;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.git-integration {
  margin-top: 16px;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 16px;
}
.git-form > div {
  margin-bottom: 8px;
}
.git-form label {
  display: inline-block;
  margin-right: 10px;
  min-width: 120px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: #fafafa;
  border: 1px solid #eee;
  padding: 6px 8px;
  border-radius: 6px;
  margin-top: 6px;
  word-break: break-all;
}
.hint {
  color: #666;
  font-size: 0.9em;
}
</style>

