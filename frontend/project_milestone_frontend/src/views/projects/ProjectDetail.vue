<template>
  <div>
    <h2>项目详情 - {{ project.name }}</h2>
    <p>{{ project.description }}</p>
    <button v-if="isAdmin" @click="showForm = !showForm">添加 WBS 节点</button>

    <!-- WBS 列表 -->
    <h3>WBS 节点</h3>
    <ul>
      <li v-for="item in wbsItems" :key="item.id">
        {{ item.name }} (持续 {{ item.duration }} 天)
      </li>
      <li v-if="wbsItems.length === 0">暂无 WBS 节点</li>
    </ul>

    <!-- 添加表单 -->
    <div v-if="showForm" class="wbs-form">
      <h4>新建 WBS 节点</h4>
      <form @submit.prevent="submitWbs">
        <div>
          <label>名称</label>
          <input v-model="newItem.name" required />
        </div>
        <div>
          <label>持续天数</label>
          <input v-model.number="newItem.duration" type="number" min="1" required />
        </div>
        <div>
          <label>描述</label>
          <input v-model="newItem.description" />
        </div>
        <button type="submit">提交</button>
      </form>
      <p v-if="wbsError" class="error">{{ wbsError }}</p>
    </div>

    <!-- 新建任务按钮/表单 -->
    <button v-if="isAdmin" @click="showTaskForm = !showTaskForm" style="margin-top: 20px;">新建任务</button>
    <div v-if="showTaskForm" class="task-form">
      <h4>新建任务</h4>
      <form @submit.prevent="submitTask">
        <div>
          <label>选择 WBS 节点</label>
          <select v-model.number="newTask.wbsItemId">
            <option v-for="item in wbsItems" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div>
          <label>任务名称</label>
          <input v-model="newTask.name" required />
        </div>
        <div>
          <label>预计时长(天)</label>
          <input type="number" v-model.number="newTask.duration" min="1" required />
        </div>
        <button type="submit">创建</button>
      </form>
      <p v-if="taskError" class="error">{{ taskError }}</p>
    </div>

    <!-- 任务列表 -->
    <h3>任务列表</h3>
    <table v-if="tasks.length > 0" class="task-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>预计时长</th>
          <th>前置任务</th>
          <th>后续任务</th>
          <th>完成情况</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tasks" :key="t.id">
          <td>{{ t.name }}</td>
          <td>{{ t.duration ?? '-' }} 天</td>
          <td>
            <span v-if="t.predecessors && t.predecessors.length">
              {{ t.predecessors.map(p => p.id).join(', ') }}
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="t.successors && t.successors.length">
              {{ t.successors.map(s => s.id).join(', ') }}
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <input type="number" v-model.number="t.percentComplete" @change="updateTaskStatus(t)" min="0" max="100" />%
          </td>
          <td>
            <button @click="updateTaskStatus(t)">更新</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="no-task">暂无任务</p>

    <p v-if="taskError" class="error">{{ taskError }}</p>

    <!-- WBS 任务图示占位 -->
    <!-- 可视化 WBS 图 -->
    <div class="mermaid" style="margin-top:20px;" v-text="graphDef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getProject } from '@/api/project';
import { getWbsItems, createWbsItem } from '@/api/wbs-item';
import type { WbsItemDto } from '@/api/wbs-item';
import { getTasksByProject, createTask, updateTask } from '@/api/task';
import type { TaskDto } from '@/api/task';
import mermaid from 'mermaid';

interface ProjectDetail {
  id: number;
  name: string;
  description?: string;
  role?: string;
}

const route = useRoute();
const projectId = computed(() => Number(route.params.id));
const project = ref<ProjectDetail>({ id: 0, name: '', description: '' });
const error = ref<string>('');

const isAdmin = computed(() => project.value.role !== 'member');

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

async function loadWbs() {
  try {
    const res = await getWbsItems(projectId.value);
    wbsItems.value = res.data;
    // 默认选中首个WBS节点
    if (wbsItems.value.length) {
      newTask.value!.wbsItemId = wbsItems.value[0].id;
    }
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

async function submitWbs() {
  wbsError.value = '';
  try {
    const dto = { projectId: projectId.value, ...newItem.value };
    const res = await createWbsItem(dto);
    wbsItems.value.push(res.data);
    showForm.value = false;
    newItem.value = { name: '', description: '', duration: 1 };
  } catch (e) {
    console.error('创建 WBS 失败', e);
    wbsError.value = '创建失败，请重试';
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

// 初始化加载项目、WBS 和任务，并初始化 Mermaid
onMounted(async () => {
  try {
    const res = await getProject(projectId.value);
    project.value = res.data;
    await loadWbs();
    await loadTasks();
    mermaid.initialize({ startOnLoad: true, deterministicIds: true });
  } catch (e) {
    console.error('加载项目详情失败', e);
    error.value = '加载项目失败';
  }
});
// 监听 WBS 和任务变化，生成 Mermaid 图并渲染
watch([wbsItems, tasks], async () => {
  let graph = 'flowchart TB\n';
  wbsItems.value.forEach(w => {
    graph += `  subgraph WBS_${w.id}["${w.name}"]\n`;
    tasks.value.filter(t => t.wbsItemId === w.id).forEach(t => {
      graph += `    T${t.id}["${t.name} (${t.percentComplete ?? 0}%)"]\n`;
    });
    graph += '  end\n';
  });
  graphDef.value = graph;
  await nextTick();
  mermaid.init(undefined, '.mermaid');
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
</style>

