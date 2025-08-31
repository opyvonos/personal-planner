<template>
  <div class="main-layout">
    <!-- sidebar with event controls -->
    <aside class="sidebar">
      <div class="header-with-button">
        <h3>Завдання</h3>
        <!-- button to add a new task -->
        <button @click="showModal = true" class="add-task-btn">+ Нове завдання</button>
      </div>

      <!-- modal for adding a new task -->
      <AddTaskModal v-if="showModal" @close="handleModalClose" />

      <!-- search input -->
      <div class="search-wrapper">
        <input type="text" v-model="searchQuery" class="search-input" placeholder="Пошук завдань..." />
        <span v-if="searchQuery" class="clear-icon" @click="searchQuery = ''">✕</span>
      </div>

      <!-- filter tsasks by priority -->
      <select v-model="selectedPriority" class="priority-filter-select">
        <option :value="null">Всі пріоритети</option>
        <option :value="0">Без пріоритету</option>
        <option v-for="priority in priorities" :key="priority.priority_level_id" :value="priority.priority_level_id">
          {{ priority.name }}
        </option>
      </select>

      <!-- task filter menu -->
      <ul class="filter-menu">
        <li @click="setFilter(null)" :class="{ active: !currentFilter }">Усі завдання</li>
        <li @click="setFilter('upcoming')" :class="{ active: currentFilter === 'upcoming' }">Майбутні</li>
        <li @click="setFilter('no-date')" :class="{ active: currentFilter === 'no-date' }">Без дати</li>
        <li @click="setFilter('complete')" :class="{ active: currentFilter === 'complete' }">Завершені</li>
        <li @click="setFilter('incomplete')" :class="{ active: currentFilter === 'incomplete' }">Незавершені</li>
        <li @click="setFilter('overdue')" :class="{ active: currentFilter === 'overdue' }" class="overdue-li">Прострочені</li>
        <hr class="filter-divider" />
        <!-- button to switch to analytics -->
        <li @click="currentFilter = 'analytics'; showAnalytics = true" :class="{ active: currentFilter === 'analytics' }">Аналіз продуктивності</li>
      </ul>
    </aside>

    <!-- main page content -->
    <div class="task-table-container">
      <div v-if="showAnalytics">
        <!-- display analytics -->
        <UserAnalytics v-if="currentFilter === 'analytics'" :tasks="tasks" />
      </div>

      <template v-else>
        <!-- task list -->
        <div class="task-list">
          <div v-for="(tasks, date) in groupedTasksByDate" :key="date" class="task-group">
            <h4 class="task-date-heading">
              {{ formatDateHeading(date) }}
            </h4>

            <div v-for="task in tasks" :key="task.task_id"
              :class="['task-row', { selected: selectedTask?.task_id === task.task_id, overdue: isOverdue(task), completed: task.status_name === 'complete' }]"
              @click="selectTask(task)" :title="getPriorityName(task.priority_level_id)">
              <div class="priority-bar" :style="{ backgroundColor: getPriorityColor(task.priority_level_id) }"></div>
              <div class="col-checkbox">
                <input type="checkbox" :checked="task.status_name === 'complete'" @change="toggleTaskStatus(task)" @click.stop/>
              </div>

              <div class="col-date" v-if="task.due_date">
                <span>{{ formatDueDate(task) }}</span>
              </div>

              <div class="col-title">
                <span class="priority-indicator" :style="{ backgroundColor: getPriorityColor(task.priority_level_id) }"></span>
                <span class="truncate-title" >{{ task.title }}</span>
              </div>

              <div class="col-delete">
                <button @click.stop="confirmDelete(task)"class="delete-task-btn" title="Видалити завдання">
                  <img src="/delete-icon.svg" class="icon-img">
                </button>
              </div>
            </div>
          </div>

          <!-- if the task list is empty -->
          <div v-if="filteredTasks.length === 0" class="empty-list">
            <img src="/inbox-icon.svg" class="icon-tasks">
            <p>Завдань поки що немає</p>
          </div>
        </div>
      </template>
    </div>

    <!-- task edit sidebar -->
    <aside class="sidebar task-details" v-if="!showAnalytics && selectedTask">
      <div class="header-with-button">
        <h3>Завдання</h3>
        <button @click="clearSelection" class="close-btn">✕</button>
      </div>

      <form @submit.prevent="submitTask" class="edit-task-form">
        <label>Назва<span style="color:red">*</span>
          <input v-model="title" type="text" required />
        </label>
        <label>Опис
          <textarea v-model="description" />
        </label>
        <div class="date-time-row">
          <label class="date-label">Дата
            <input type="date" v-model="dueDate" />
          </label>
          <label class="time-label">Час
            <input type="time" v-model="dueTime" />
          </label>
        </div>
        <label>Пріоритет
          <select v-model.number="priority_level_id">
            <option :value="null">Немає</option>
            <option v-for="priority in priorities" :key="priority.priority_level_id" :value="priority.priority_level_id">
              {{ priority.name }}
            </option>
          </select>
        </label>
        <div class="form-actions">
          <button type="button" @click="confirmDelete(selectedTask)" class="delete-btn">Видалити</button>
          <button type="submit" class="update-btn">Оновити</button>
        </div>
      </form>
    </aside>

    <!-- if no task is selected -->
    <aside class="sidebar task-details" v-else-if="!showAnalytics">
      <div class="empty-sidebar">
        <h3>Завдання</h3>
        <p>Оберіть завдання зі списку ліворуч, щоб переглянути деталі</p>
      </div>
    </aside>
  </div>

  <!-- delete confirmation modal -->
  <div v-if="showDeleteConfirm" class="delete-confirm">
      <div class="confirm-box">
        <p>Видалити завдання "{{ truncateText(taskToDelete?.title) }}"?</p>
        <button @click="cancelDelete">Ні</button>
        <button @click="deleteTaskConfirmed">Так</button>
      </div>
  </div>

  <!-- floating action button -->
  <div class="fab-container">
    <button class="fab-main" @click="toggleMenu" :aria-expanded="isOpen" aria-label="Відкрити меню навігації">
      ☰
    </button>
    <transition-group name="fab" tag="div" class="fab-menu">
      <template v-for="item in menuItems" :key="item.name">
        <router-link v-if="item.route" :to="item.route" class="fab-action" v-show="isOpen" :title="item.name">
          {{ item.name }}
        </router-link>
        <button v-else-if="item.action === 'openSettings'" @click="openSettings" class="fab-action" v-show="isOpen" :title="item.name" type="button">
          {{ item.name }}
        </button>
      </template>
    </transition-group>
  </div>

  <!-- settings modal -->
  <SettingsModal v-if="showSettingsModal" :visible="showSettingsModal" @close="closeSettings"/>
</template>

<script>
import AddTaskModal from './AddTaskModal.vue';
import UserAnalytics from './UserAnalytics.vue';
import SettingsModal from './SettingsModal.vue';

export default {
  props: {
    task: Object,
  },
  components: { AddTaskModal, UserAnalytics, SettingsModal },
  data() {
    return {
      // task state
      showModal: false,
      tasks: [],
      selectedTask: null,
      searchQuery: '',
      isOpen: false,
      showSettingsModal: false,
      menuItems: [
        { name: 'Головна', route: '/' },
        { name: 'Завдання', route: '/tasks' },
        { name: 'Події', route: '/events' },
        { name: 'Нотатки', route: '/notes' },
        { name: 'Журнал активності', route: '/audit-log' },
        { name: 'Налаштування', action: 'openSettings' }
      ],
      currentFilter: null,
      showAnalytics: false,
      // fields for edit form
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority_level_id: null,
      priorities: [],
      selectedPriority: null,
      showDeleteConfirm: false,
      taskToDelete: null,
      reminderTimeouts: [],
      remindedTaskIds: new Set(),
    };
  },
  watch: {
    // if date is cleared, time is also cleared
    dueDate(newVal) {
      if (!newVal) {
        this.dueTime = '';
      }
    },
  },
  computed: {
    // format task date
    formattedDate: {
      get() {
        return this.selectedTask?.due_date?.split('T')[0] || '';
      },
      set(value) {
        if (this.selectedTask) this.selectedTask.due_date = value;
      },
    },
    // filter tasks by search, filters, and priority
    filteredTasks() {
      const q = this.searchQuery.toLowerCase();
      const now = new Date();

      return this.tasks
      .filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
        const matchesPriority =
        this.selectedPriority === null 
        ? true
        : this.selectedPriority === 0 
        ? (task.priority_level_id === null || task.priority_level_id === undefined)
        : task.priority_level_id === this.selectedPriority;

        let matchesFilter = true;

        switch (this.currentFilter) {
          case 'overdue': matchesFilter = this.isOverdue(task); break;
          case 'upcoming': {
            if (!task.due_date || task.status_name === 'complete') {
              matchesFilter = false;
            } else {
              const taskDate = new Date(task.due_date);
              taskDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              matchesFilter = taskDate >= today;
            }
            break;
          }
          case 'no-date': matchesFilter = !task.due_date; break;
          case 'complete': matchesFilter = task.status_name === 'complete'; break;
          case 'incomplete': matchesFilter = task.status_name === 'incomplete'; break;
        }
        return matchesSearch && matchesPriority && matchesFilter;
      })
    },
    // group tasks by date
    groupedTasksByDate() {
      const grouped = {};
      this.filteredTasks.forEach(task => {
        const dateKey = task.due_date
        ? new Date(task.due_date).toISOString().split('T')[0]
        : 'Без дати';
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      });

      return Object.keys(grouped)
        .sort((a, b) => {
          if (a === 'Без дати') return 1;
          if (b === 'Без дати') return -1;
          return new Date(a) - new Date(b);
      })
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
    }
  },
  methods: {
    // fetch tasks from backend
    async fetchTasks() {
      try {
        const res = await fetch('http://localhost:3000/tasks');
        this.tasks = await res.json();
        this.scheduleReminders();
      } catch (err) {}
    },
    // update task
    async submitTask() {
      let due_date = null;
      if (this.dueDate && this.dueTime) {
        due_date = `${this.dueDate}T${this.dueTime}:00`;
        } else if (this.dueDate) {
          due_date = `${this.dueDate}`;
        } else if (this.dueTime) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          due_date = `${yyyy}-${mm}-${dd}T${this.dueTime}:00`;
        }

      const updatedTask = {
        ...this.selectedTask,
        title: this.title,
        description: this.description,
        due_date,
        priority_level_id: this.priority_level_id ?? null,
        status_id: this.selectedTask.status_id || 2,
      };

      try {
        await fetch(`http://localhost:3000/tasks/${this.selectedTask.task_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTask),
        });
        this.fetchTasks();
        this.clearSelection();
        } catch (err) {}
    },
    // fetch priorities for tasks
    async fetchPriorities() {
      try {
        const res = await fetch('http://localhost:3000/priorities');
          this.priorities = await res.json();
        } catch (error) {
          this.priorities = [];
        }
    },
    // get priority color
    getPriorityColor(priorityId) {
      const priority = this.priorities.find(p => p.priority_level_id === priorityId);
      return priority ? priority.color : '#a8a8a8';
    },
    // get priority title
    getPriorityName(id) {
      if (id === null || id === undefined) return 'Без пріоритету';
      const priority = this.priorities.find(p => p.priority_level_id === id);
      return priority ? `Пріоритет: ${priority.name}` : 'Невідомий пріоритет';
    },
    // format due date
    formatDueDate(task) {
      const date = new Date(task.due_date);
      if (task.due_date.includes('T')) {
        return date.toLocaleString('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        return `–:–`;
      }
    },
    // check if overdue
    isOverdue(task) {
      return task.due_date && new Date(task.due_date) < new Date() && task.status_name !== 'complete';
    },
    // select task
    selectTask(task) {
      this.selectedTask = { ...task };
      this.title = task.title || '';
      this.description = task.description || '';

      if (task.due_date) {
        const dt = new Date(task.due_date);
        this.dueDate = dt.toISOString().slice(0, 10);
        const hasTime = task.due_date.includes('T');
        this.dueTime = hasTime ? dt.toTimeString().slice(0, 5) : '';
      } else {
        this.dueDate = '';
        this.dueTime = '';
      }
      this.priority_level_id = task.priority_level_id || null;
    },
    // clear selection
    clearSelection() {
      this.selectedTask = null;
    },
    // change task status
    async toggleTaskStatus(task) {
      const newStatus = task.status_name === 'complete' ? 'incomplete' : 'complete';
      const updatedTask = {
        ...task,
        status_name: newStatus,
        status_id: newStatus === 'complete' ? 1 : 2,
      };

      try {
        await fetch(`http://localhost:3000/tasks/${task.task_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTask),
        });
        await this.fetchTasks();
        if (this.selectedTask && this.selectedTask.task_id === task.task_id) {
          this.selectTask(updatedTask);
        }
      } catch (err) {}
    },
    // set filter
    setFilter(filter) {
      this.currentFilter = filter;
      this.showAnalytics = false;
    },
    // toggle analytics
    toggleAnalytics() {
      this.showAnalytics = !this.showAnalytics;
      if (this.showAnalytics) {
        this.clearSelection();
      }
    },
    // show toast notifications
    showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'event-toast';
      const text = document.createElement('span');
      text.textContent = message;
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Закрити';
      closeBtn.className = 'toast-close';

      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      });

      toast.appendChild(text);
      toast.appendChild(closeBtn);
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
      }, 100);

      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    },
    // schedule reminders for tasks
    scheduleReminders() {
      this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
      this.reminderTimeouts = [];
      this.remindedTaskIds.clear();
      const now = Date.now();

      this.tasks.forEach(task => {
        if (!task.due_date || task.status_name === 'complete') return;
        const dueTime = new Date(task.due_date).getTime();
        const oneHourBefore = dueTime - 60 * 60 * 1000;

        // reminder 1 hour before
        if (oneHourBefore > now && !this.remindedTaskIds.has(`${task.task_id}-1h`)) {
          const timeoutId = setTimeout(() => {
            this.showToast(`⏰ За годину дедлайн: "${task.title.length > 20 ? task.title.slice(0,17) + '...' : task.title}"`);
            this.remindedTaskIds.add(`${task.task_id}-1h`);
          }, oneHourBefore - now);
          this.reminderTimeouts.push(timeoutId);
        }
        // reminder ...
        if (dueTime > now && !this.remindedTaskIds.has(`${task.task_id}-due`)) {
          const timeoutId = setTimeout(() => {
            this.showToast(`🚨⏰ Завдання "${task.title.length > 20 ? task.title.slice(0,17) + '...' : task.title}" має дедлайн зараз!`);
            this.remindedTaskIds.add(`${task.task_id}-due`);
          }, dueTime - now);
          this.reminderTimeouts.push(timeoutId);
        }
      });
    },
    // delete confirmation
    confirmDelete(task) {
      this.taskToDelete = task;
      this.showDeleteConfirm = true;
    },
    // cancel deletion
    cancelDelete() {
      this.taskToDelete = null;
      this.showDeleteConfirm = false;
    },
    // confirm deletion and call backend
    async deleteTaskConfirmed() {
      if (!this.taskToDelete) return;
      try {
        await fetch(`http://localhost:3000/tasks/${this.taskToDelete.task_id}`, {
          method: 'DELETE',
        });
        this.cancelDelete();
        this.fetchTasks();
      } catch (err) {}
      this.selectedTask = null;
    },
    // truncate long text
    truncateText(text, maxLength = 20) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
    },
    // floating action button
    toggleMenu() {
      this.isOpen = !this.isOpen;
    },
    // format date heading
    formatDateHeading(dateStr) {
      if (dateStr === 'Без дати') return 'Без дати';
      const daysUkrainian = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
      const date = new Date(dateStr);
      const dayName = daysUkrainian[date.getDay()];
      const dayAndMonth = date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long'
      });
      return `${dayName}, ${dayAndMonth}`;
    },
    // close modal window
    handleModalClose() {
      this.showModal = false;
      this.fetchTasks();
    },
    // settings modal handlers
    openSettings() {
      this.showSettingsModal = true;
      this.isOpen = false;
    },
    closeSettings() {
      this.showSettingsModal = false;
    },
  },
  mounted() {
    // fatch tasks and priorities on mount
    this.fetchTasks();
    this.fetchPriorities();
  },
};
</script>

<style scoped>
.main-layout {
  display: flex;
  overflow: hidden;
  height: 100vh;
}

.task-table-container {
  flex: 1;
  padding: 20px;
  padding-top: 10px;
  overflow-y: auto;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
}

.header-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.close-btn,
.update-btn {
  font-size: 14px;
  background: var(--color-button);
  color: var(--color-text-light);
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.task-details label {
  display: block;
  margin-bottom: 12px;
}

.task-details input,
.task-details textarea,
.task-details select {
  resize: vertical;
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid var(--color-border);
  border-radius: 6px !important;
  background: #fff;
  box-sizing: border-box;
}

.empty-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-muted);
  
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-row {
  background: #fafafa;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 20px;
  transition: var(--transition);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
}

.task-row:hover {
  box-shadow: var(--shadow);
  cursor: pointer;
}

.task-row.selected {
  background-color: var(--color-accent-light);
}

.col-checkbox {
  width: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  accent-color: var(--color-accent-dark);
}

.col-title {
  flex: 1;
  min-width: 70px;
}

.col-date {
  flex: 0;
  min-width: 30px;
}

.truncate-title {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.truncate-description {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date-time-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.date-time-row label {
  flex: 1;
  margin-bottom: 0;
}

.date-label,
.time-label {
  display: flex;
  flex-direction: column;
}

.date-time-row input {
  width: 100%;
}

input[type="text"],
input[type="date"],
input[type="time"],
textarea,
select {
  width: 100%;
  padding: 6px 10px;
  font-size: 14px;
  border: 1.5px solid #ccc;
  border-radius: 5px;
  transition: border-color 0.25s ease;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  flex-wrap: wrap;
}

.update-btn,
.delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-btn {
  background: var(--color-gray);
  color: var(--color-text-dark);
  font-size: 14px;
}

.task-row {
  display: flex;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  transition: background 0.2s;
}

.task-date-heading {
  font-weight: bold;
  font-size: 17px;
  margin: 15px 0 10px;
  color: var(--color-text-dark);
}

.priority-bar {
  width: 6px;
  border-radius: 2px;
}

.task-content {
  display: flex;
  align-items: center;
  padding: 10px;
  flex: 1;
  gap: 10px;
}

.task-row.completed {
  opacity: 0.5;
}
.filter-menu {
  list-style: none;
  padding-left: 0;
  margin: 0 0 20px 0;
  font-size: 1rem;
}

.filter-menu li {
  padding: 10px 15px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: var(--color-text-dark);
  user-select: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  box-sizing: border-box;
}

.overdue-li {
  color: var(--color-delete) !important;
  font-weight: bold;
}

.overdue-li:hover {
  color: #fdc6c6 !important;
  font-weight: bold;
}

.overdue-li.active {
  color: #fdc6c6 !important;
  font-weight: bold;
}

.filter-menu li:hover {
  background-color: var(--color-accent-dark);
  color: var(--color-text-light);
}

.filter-menu li.active {
  background-color: var(--color-accent-dark);
  color: var(--color-text-light);
  font-weight: 700;
  border-color: var(--color-border);
}

.menu-link {
  background: none;
  border: none;
  padding: 10px 15px;
  color: var(--color-accent);
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius);
  font-size: 1rem;
  transition: background-color 0.3s ease;
  text-align: left;
  width: 100%;
  margin-top: auto;
}

.menu-link:hover {
  background-color: var(--color-border);
}

.priority-filter-select {
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
}

.filter-divider {
  border: none;
  border-top: 2px solid var(--color-border);
  margin: 15px 10px;
}

.delete-task-btn {
  background-color: transparent;
}
</style>