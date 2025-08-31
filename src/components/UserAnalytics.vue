<template>
  <div class="activity-page-wrapper">
    <h2>Продуктивність</h2>
    <div class="activity-container">
      <!-- statstics column -->
      <div class="stats-column">
        <h3>Загальна статистика</h3>
        <div class="stats-grid">
          <!-- total tasks -->
          <div class="stat-item">
            <span class="stat-value">{{ totalTasks }}</span>
            <span class="stat-label">Всього завдань</span>
          </div>
          <!-- completion rate -->
          <div class="stat-item">
            <span class="stat-value">{{ completionRate }}%</span>
            <span class="stat-label">Завершено</span>
          </div>
          <!-- overdue tasks -->
          <div class="stat-item">
            <span class="stat-value overdue-value">{{ overdueTasks }}</span>
            <span class="stat-label overdue-label">Прострочено</span>
          </div>
          <!-- most productive day -->
          <div class="stat-item">
            <span class="stat-value">{{ mostProductiveDay }}</span>
            <span class="stat-label">Найпродуктивніший день</span>
          </div>
        </div>
        <!-- pie chart -->
        <div class="pie-chart-wrapper">
          <canvas ref="pieChart"></canvas>
        </div>
      </div>
      <!-- column with line chart -->
      <div class="logs-column">
        <h3>Динаміка за 7 днів</h3>
        <div class="chart-container">
          <canvas ref="lineChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
export default {
  name: 'UserAnalytics',
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      pieChartInstance: null,
      lineChartInstance: null,
      updateInterval: null,
    };
  },
  computed: {
    // total number of tasks
    totalTasks() {
      return this.tasks.length;
    },
    // completed tasks count
    completedTasks() {
      return this.tasks.filter(t => t.status_name === 'complete').length;
    },
    // completion percentage
    completionRate() {
      return this.totalTasks === 0 ? 0 : Math.round((this.completedTasks / this.totalTasks) * 100);
    },
    // overdue tasks count
    overdueTasks() {
      const now = new Date();
      return this.tasks.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < now && t.status_name !== 'complete';
      }).length;
    },
    // data for tasks created and completed over the last 7 days
    tasksPerDayData() {
      const now = new Date();
      const created = {};
      const completed = {};

      // initialize last 7 days with zeros
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        created[key] = 0;
        completed[key] = 0;
      }

      // count created and completed tasks
      this.tasks.forEach(t => {
        if (t.created_at) {
          const key = new Date(t.created_at).toISOString().split('T')[0];
          if (created[key] !== undefined) created[key]++;
        }
        if (t.status_name === 'complete' && t.updated_at) {
          const key = new Date(t.updated_at).toISOString().split('T')[0];
          if (completed[key] !== undefined) completed[key]++;
        }
      });

      return { created, completed };
    },
    // day of the week with the most completed tasks
    mostProductiveDay() {
      const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
      const dayCount = Array(7).fill(0);

      this.tasks.forEach(t => {
        if (t.status_name === 'complete' && t.updated_at) {
          const date = new Date(t.updated_at);
          const dayIndex = date.getDay();
          dayCount[dayIndex]++;
        }
      });

      const maxCount = Math.max(...dayCount);
      if (maxCount === 0) {
        return '–';
      }

      const maxIndex = dayCount.indexOf(maxCount);
      return days[maxIndex];
    },
    // data for pie chart: done vs undone
    statusDistribution() {
      const done = this.completedTasks;
      const undone = this.totalTasks - done;
      return [done, undone];
    }
  },
  methods: {
    // render pie chart
    renderPieChart() {
      if (this.pieChartInstance) this.pieChartInstance.destroy();
      this.pieChartInstance = new Chart(this.$refs.pieChart.getContext('2d'), {
        type: 'pie',
        data: {
          labels: ['Завершені', 'Незавершені'],
          datasets: [{
            data: this.statusDistribution,
            backgroundColor: ['#51906d', '#eeaa61']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    },
    // render line chart for 7-day dynamics
    renderLineChart() {
      if (this.lineChartInstance) this.lineChartInstance.destroy();

      const rawDates = Object.keys(this.tasksPerDayData.created);
      const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
      // labels for X axis
      const labels = rawDates.map(dateStr => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', options).replace(',', '');
      });
      const createdData = Object.values(this.tasksPerDayData.created);
      const completedData = Object.values(this.tasksPerDayData.completed);

      this.lineChartInstance = new Chart(this.$refs.lineChart.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Створено',
              data: createdData,
              borderColor: '#5383c3',
              fill: false,
              tension: 0.3
            },
            {
              label: 'Завершено',
              data: completedData,
              borderColor: '#51906d',
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              precision: 0
            }
          }
        }
      });
    },
    // fully refresh both charts
    refreshCharts() {
      if (this.pieChartInstance) {
        this.pieChartInstance.destroy();
      }
      if (this.lineChartInstance) {
        this.lineChartInstance.destroy();
      }
      this.renderPieChart();
      this.renderLineChart();
    },
    // debounced refresh (to avoid too frequent re-renders)
    debouncedRefresh() {
      clearTimeout(this.updateInterval);
      this.updateInterval = setTimeout(() => {
        this.refreshCharts();
      }, 300);
    }
  },
  mounted() {
    this.refreshCharts(); // render charts on mount
  },
  watch: {
    // watch for changes in tasks array
    tasks: {
      deep: true,
      handler() {
        this.debouncedRefresh();
      }
    }
  }
};
</script>

<style scoped>
.activity-page-wrapper {
  padding: 20px 20px 0 20px;
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.activity-page-wrapper h2 {
  font-size: 1.8rem;
  color: var(--color-text-dark);
  margin: 0 0 20px 0;
}

.activity-container {
  flex: 1;
  display: flex;
  gap: 24px;
  background: var(--color-bg);
  padding: 20px 40px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  overflow: hidden;
}

.stats-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 280px;
}

.stats-column h3,
.logs-column h3 {
  margin: 20px 15px;
  color: var(--color-text-dark);
  font-size: 1.25rem;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 260px;
  max-height: 320px;
}

.logs-column {
  flex: 2;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (max-width: 768px) {
  .activity-container {
    flex-direction: column;
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    min-height: 220px;
  }
}

.stat-item {
  background: var(--color-bg);
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60px;
  box-sizing: border-box;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-dark);
  margin-bottom: 4px;
  line-height: 1.5;
}

.stat-label {
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.2;
}
.pie-chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 16px;
}

.pie-chart-wrapper canvas {
  max-width: 500px;
  max-height: 250px;
}

.overdue-label, .overdue-value {
  color: var(--color-delete);
}

.logs-column .chart-container {
  min-height: 320px;
  max-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}
</style>