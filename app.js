const storageKey = 'fitness-tracker-data-v1';
const exerciseCatalog = {
  '跳绳': 12.3,
  '俯卧撑': 8,
  '深蹲': 5.5,
  '跑步(中速)': 9.8,
  '慢跑/快走': 6,
  '骑行': 7.5,
  '波比跳': 10,
  '平板支撑': 3.3,
};

const defaultData = {
  profile: { weight: 60, goal: 'balanced', trainDays: 4 },
  workouts: {},
  weightLogs: [],
  plan: '',
};

let appState = loadData();

function loadData() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.warn('无法读取本地数据', error);
  }
  return { ...defaultData };
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(appState));
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function populateExerciseList() {
  const list = document.getElementById('exercise-list');
  list.innerHTML = '';
  Object.keys(exerciseCatalog).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    list.appendChild(option);
  });
}

function initDates() {
  document.getElementById('date').value = formatDate();
  document.getElementById('weight-date').value = formatDate();
}

function hydrateProfile() {
  const { weight, goal, trainDays } = appState.profile;
  document.getElementById('weight').value = weight || '';
  document.getElementById('goal').value = goal;
  document.getElementById('train-days').value = trainDays;
  document.getElementById('plan-goal').value = goal;
  document.getElementById('plan-days').value = trainDays;
  document.getElementById('plan-output').value = appState.plan || '';
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const weight = Number(document.getElementById('weight').value) || 0;
  const goal = document.getElementById('goal').value;
  const trainDays = Number(document.getElementById('train-days').value) || 3;
  appState.profile = { weight, goal, trainDays };
  persist();
  document.getElementById('profile-status').textContent = '已保存个人信息，生成计划或记录将使用当前体重。';
}

function calculateDurationMinutes(sets, reps, durationInput) {
  if (durationInput > 0) return durationInput;
  const estimatedSecondsPerRep = 3; // 简单估算：每次 3 秒
  return (sets * reps * estimatedSecondsPerRep) / 60;
}

function estimateCalories(exercise, durationMinutes, weight) {
  const met = exerciseCatalog[exercise] || 5;
  const hours = Math.max(durationMinutes, 1) / 60; // 避免 0，最少按 1 分钟估算
  return +(met * weight * hours).toFixed(1);
}

function addWorkout(event) {
  event.preventDefault();
  const date = document.getElementById('date').value || formatDate();
  const exercise = document.getElementById('exercise').value.trim();
  const sets = Number(document.getElementById('sets').value) || 0;
  const reps = Number(document.getElementById('reps').value) || 0;
  const duration = Number(document.getElementById('duration').value) || 0;
  const notes = document.getElementById('notes').value.trim();
  if (!exercise) return;

  const durationMinutes = calculateDurationMinutes(sets, reps, duration);
  const calories = estimateCalories(exercise, durationMinutes, appState.profile.weight || 60);
  const entry = { exercise, sets, reps, durationMinutes, notes, calories };

  if (!appState.workouts[date]) appState.workouts[date] = [];
  appState.workouts[date].push(entry);
  persist();

  document.getElementById('workout-form').reset();
  initDates();
  renderWorkouts();
  renderCalories();
}

function renderWorkouts() {
  const container = document.getElementById('workout-list');
  container.innerHTML = '';
  const dates = Object.keys(appState.workouts).sort((a, b) => (a > b ? -1 : 1));
  dates.forEach((date) => {
    const dayBlock = document.createElement('div');
    dayBlock.className = 'item';
    const heading = document.createElement('div');
    heading.className = 'item-header';
    heading.innerHTML = `<strong>${date}</strong><span class="badge">${sumDayCalories(date)} kcal</span>`;
    dayBlock.appendChild(heading);

    const list = document.createElement('div');
    appState.workouts[date].forEach((w) => {
      const row = document.createElement('p');
      row.className = 'muted';
      row.textContent = `${w.exercise} · ${w.sets}x${w.reps} | ${w.durationMinutes.toFixed(1)} 分钟 · ${w.calories} kcal ${w.notes ? ' · ' + w.notes : ''}`;
      list.appendChild(row);
    });
    dayBlock.appendChild(list);
    container.appendChild(dayBlock);
  });
}

function sumDayCalories(date) {
  const entries = appState.workouts[date] || [];
  return entries.reduce((total, w) => total + Number(w.calories || 0), 0).toFixed(1);
}

function renderCalories() {
  const summary = document.getElementById('calorie-summary');
  const today = formatDate();
  const weekDates = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - idx);
    return formatDate(d);
  }).reverse();

  let todayCalories = 0;
  const weekData = weekDates.map((d) => {
    const value = Number(sumDayCalories(d));
    if (d === today) todayCalories = value;
    return value;
  });

  const weekSum = weekData.reduce((a, b) => a + b, 0).toFixed(1);
  summary.textContent = `今日估算消耗 ${todayCalories} kcal · 近 7 天 ${weekSum} kcal`;
  drawCalorieChart(weekDates, weekData);
}

function addWeight(event) {
  event.preventDefault();
  const date = document.getElementById('weight-date').value || formatDate();
  const weight = Number(document.getElementById('weight-entry').value) || 0;
  if (!weight) return;
  appState.weightLogs.push({ date, weight });
  appState.weightLogs.sort((a, b) => (a.date > b.date ? 1 : -1));
  persist();
  renderWeights();
}

function renderWeights() {
  const container = document.getElementById('weight-log');
  container.innerHTML = '';
  appState.weightLogs.forEach((w) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = `${w.date} · ${w.weight} kg`;
    container.appendChild(item);
  });
  drawWeightChart(appState.weightLogs);
}

function generatePlan(goal, days) {
  const templates = {
    'fat-loss': ['跳绳 + 俯卧撑 + 核心 15 分钟', '间歇跑步 20-30 分钟', '全身 HIIT 20 分钟', '力量循环：深蹲/弓步/支撑'],
    cardio: ['低强度慢跑或骑行 30 分钟', '跳绳间歇 15-20 分钟', '耐力跑或爬楼 25 分钟', '核心稳定 + 呼吸训练'],
    balanced: ['力量：深蹲/硬拉/推举 30 分钟', '心肺：跳绳或划船机 15 分钟', '混合 HIIT 20 分钟', '恢复：拉伸 + 走路 30 分钟'],
  };

  const base = templates[goal] || templates.balanced;
  const plan = Array.from({ length: days }, (_, idx) => `第 ${idx + 1} 天：${base[idx % base.length]}`);
  return plan.join('\n');
}

function handlePlanGenerate(event) {
  event.preventDefault();
  const goal = document.getElementById('plan-goal').value;
  const days = Number(document.getElementById('plan-days').value) || 3;
  const planText = generatePlan(goal, days);
  document.getElementById('plan-output').value = planText;
}

function savePlan() {
  appState.plan = document.getElementById('plan-output').value;
  appState.profile.goal = document.getElementById('plan-goal').value;
  appState.profile.trainDays = Number(document.getElementById('plan-days').value) || appState.profile.trainDays;
  persist();
  document.getElementById('profile-status').textContent = '已保存计划与目标。';
}

function buildCSV() {
  const workoutRows = [['日期', '项目', '组数', '次数/组', '估算时长(分钟)', '估算热量(kcal)', '备注']];
  Object.entries(appState.workouts).forEach(([date, items]) => {
    items.forEach((w) => {
      workoutRows.push([date, w.exercise, w.sets, w.reps, w.durationMinutes, w.calories, w.notes || '']);
    });
  });

  const weightRows = [['日期', '体重(kg)']];
  appState.weightLogs.forEach((w) => weightRows.push([w.date, w.weight]));

  const toCsv = (rows) => rows.map((r) => r.join(',')).join('\n');
  const payload = `# 训练记录\n${toCsv(workoutRows)}\n\n# 体重记录\n${toCsv(weightRows)}`;
  return payload;
}

function downloadCSV() {
  const blob = new Blob([buildCSV()], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fitness-log.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function simulateSync() {
  console.info('云端同步接口预留：此处可接入用户鉴权与后端 API');
  alert('云端同步接口预留：可接入登录后同步到服务器');
}

function resetData() {
  if (!confirm('确认清空本地所有记录吗？此操作不可恢复。')) return;
  appState = { ...defaultData, workouts: {}, weightLogs: [] };
  persist();
  hydrateProfile();
  renderWorkouts();
  renderCalories();
  renderWeights();
}

let weightChart;
let calorieChart;

function drawWeightChart(data) {
  const ctx = document.getElementById('weight-chart');
  if (!ctx) return;
  if (weightChart) weightChart.destroy();
  const labels = data.map((d) => d.date);
  const values = data.map((d) => d.weight);
  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '体重 (kg)',
          data: values,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v} kg` } } },
    },
  });
}

function drawCalorieChart(labels, values) {
  const ctx = document.getElementById('calorie-chart');
  if (!ctx) return;
  if (calorieChart) calorieChart.destroy();
  calorieChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'kcal',
          data: values,
          backgroundColor: '#22c55e',
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v} kcal` } } },
    },
  });
}

function attachEvents() {
  document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);
  document.getElementById('workout-form').addEventListener('submit', addWorkout);
  document.getElementById('weight-form').addEventListener('submit', addWeight);
  document.getElementById('plan-form').addEventListener('submit', handlePlanGenerate);
  document.getElementById('save-plan').addEventListener('click', savePlan);
  document.getElementById('export-csv').addEventListener('click', downloadCSV);
  document.getElementById('simulate-sync').addEventListener('click', simulateSync);
  document.getElementById('reset-data').addEventListener('click', resetData);
}

function init() {
  populateExerciseList();
  initDates();
  hydrateProfile();
  attachEvents();
  renderWorkouts();
  renderCalories();
  renderWeights();
}

document.addEventListener('DOMContentLoaded', init);
