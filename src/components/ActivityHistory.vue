<template>
  <div class="activity-page-wrapper">
  	<!-- main content container -->
    <div class="activity-container">
      <div class="logs-column">
        <h2>Журнал активності</h2>
        <div class="activity-log-scroll-wrapper">
          <ul class="activity-log-list">
          	<!-- loop through logs in reverse order -->
            <li v-for="log in logs.slice().reverse()" :key="log.log_id" class="activity-log-item">
              {{ formatLog(log) }}
            </li>
          </ul>
        </div>
      </div>
      
      <div class="stats-column">
        <h3>Статистика</h3>
        <div class="stats-grid">
          <!-- total logs -->
          <div class="stat-item">
            <span class="stat-value">{{ logs.length }}</span>
            <span class="stat-label">Всього записів</span>
          </div>

          <!-- logs by action -->
          <div class="stat-item">
            <span class="stat-value">{{ countByAction('create') }}</span>
            <span class="stat-label">Створення</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ countByAction('update') }}</span>
            <span class="stat-label">Оновлення</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ countByAction('delete') }}</span>
            <span class="stat-label">Видалення</span>
          </div>
        </div>

        <!-- chart showing actions -->
        <div class="chart-container">
          <canvas ref="chart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- floating action button menu -->
  <div class="fab-container">
    <button class="fab-main" @click="toggleMenu" :aria-expanded="isOpen" aria-label="Відкрити меню навігації">
      ☰
    </button>
    <transition-group name="fab" tag="div" class="fab-menu">
      <template v-for="item in menuItems" :key="item.name">
      	<!-- navigation link -->
        <router-link v-if="item.route" :to="item.route" class="fab-action" v-show="isOpen" :title="item.name">
          {{ item.name }}
        </router-link>
        <!-- settings button -->
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
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import SettingsModal from './SettingsModal.vue';

// register chart components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default {
  components: { SettingsModal },
  data() {
    return {
      logs: [], // audit logs array
      chartInstance: null, // chart.js instance
      isOpen: false, // fab menu state
      showSettingsModal: false, // modal visibility
      menuItems: [
        { name: 'Головна', route: '/' },
        { name: 'Завдання', route: '/tasks' },
        { name: 'Події', route: '/events' },
        { name: 'Нотатки', route: '/notes' },
        { name: 'Журнал активності', route: '/audit-log' },
        { name: 'Налаштування', action: 'openSettings' }
      ],
    };
  },
  methods: {
  	// fetch logs from backend
    async fetchLogs() {
      try {
        const res = await fetch('http://localhost:3000/audit-log');
        this.logs = await res.json();
        this.renderChart();
      } catch (err) {}
    },
    // format log item for display
    formatLog(log) {
      const timeStr = new Date(log.time).toLocaleString();
      let actionText = '';

      switch (log.action_type) {
        case 'create':
          actionText = 'додано';
          break;
        case 'update':
          actionText = 'оновлено';
          break;
        case 'delete':
          actionText = 'видалено';
          break;
        default:
          actionText = log.action_type;
      }

      let typeText = '';
      
      switch (log.item_type_id) {
        case 1:
          typeText = 'завдання';
          break;
        case 2:
          typeText = 'подію';
          break;
        case 3:
          typeText = 'нотатку';
          break;
        default:
          typeText = 'обʼєкт';
      }

      const name = log.item_name ? `"${log.item_name}"` : 'без назви';
      return `${timeStr} — ${actionText} ${typeText} ${name}`;
    },
    // count logs by type
    countByAction(action) {
      return this.logs.filter(log => log.action_type === action).length;
    },
    // render chart.js bar chart
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = this.$refs.chart.getContext('2d');

      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['створено', 'оновлено', 'видалено'],
          datasets: [{
            label: 'Кількість дій',
            data: [
              this.countByAction('create'),
              this.countByAction('update'),
              this.countByAction('delete')
            ],
            backgroundColor: [
              'rgba(83, 132, 195, 0.7)',
              'rgba(238, 170, 97, 0.7)',
              'rgba(255, 99, 132, 0.7)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: 'var(--color-text-dark)'
              },
              grid: {
                color: 'var(--color-border)'
              }
            },
            x: {
              ticks: {
                color: 'var(--color-text-dark)'
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    },
    // floating action button
    toggleMenu() {
      this.isOpen = !this.isOpen;
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
    this.fetchLogs(); // fetch logs on mount
  }
};
</script>

<style scoped>
.activity-page-wrapper {
  padding: 24px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.activity-container {
  flex: 1;
  display: flex;
  gap: 24px;
  background: var(--color-bg);
  padding: 24px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.logs-column {
  flex: 2;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
}

.logs-column h2 {
  margin: 0 0 16px 0;
  color: var(--color-text-dark);
  font-size: 1.5rem;
}

.activity-log-list {
  flex: 1;
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow-y: auto;
  background: #fff;
  padding-right: 8px;
}

.activity-log-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 16px;
  color: var(--color-text-dark);
  transition: var(--transition);
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  border-radius: 0 !important;
}

.activity-log-item:last-child {
  border-bottom: none;
}

.activity-log-item:hover {
  background-color: #f5f5f5;
}

.stats-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  padding: 0;
}

.stats-column h3 {
  margin: 0 0 16px 0;
  color: var(--color-text-dark);
  font-size: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  background: var(--color-bg);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 1px solid var(--color-border);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.chart-container {
  flex: 1;
  min-height: 250px;
  position: relative;
}

.activity-log-scroll-wrapper {
  border-radius: 0 8px 8px 0;
  overflow: hidden;
  flex: 1;
  display: flex;
}
</style>