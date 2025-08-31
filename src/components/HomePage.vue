<template>
  <div class="dashboard">
    <!-- loading indicator -->
    <template v-if="loading" class="loading">
      <p>Завантаження...</p>
    </template>

    <template v-else>
      <!-- if PIN is required and access not granted yet -->
      <template v-if="pinRequired && !accessGranted">
        <div class="pin-entry">
          <h2>Введіть пін-код для доступу</h2>
          <input type="password" v-model="pinInput" placeholder="Пін-код" maxlength="6" @keyup.enter="checkPin"
            :disabled="lockUntil && Date.now() < lockUntil"/>
          <button @click="checkPin" :disabled="lockUntil && Date.now() < lockUntil">Підтвердити</button>
          <p class="warning" v-if="errorMessage">{{ errorMessage }}</p>
          <!-- info about available attempts -->
          <p class="info" v-if="failedAttempts === 0" style="color: var(--color-text-dark);">
            Доступно 3 спроби введення PIN-коду. Якщо вони будуть вичерпані, доступ тимчасово призупиниться.
          </p>
          <p class="warning" v-if="failedAttempts > 0 && failedAttempts < 3 && !lockUntil">Увага: після {{ 3 - failedAttempts }} {{ 3 - failedAttempts === 1 ? 'невдалої спроби' : 'невдалих спроб' }} доступ буде тимчасово заблоковано.</p>
          <p class="warning" v-if="lockCountdown > 0">До кінця блокування залишилось {{ lockCountdown }} с</p>
		    </div>
      </template>

      <!-- main content after authorization or if PIN is not required -->
      <template v-else>
        <div class="left-half">
          <img src="/planner-icon.svg" alt="Icon" class="icon-image" />
          <div class="summary-card nav-card">
            <h3 class="summary-title"><span class="icon-text">
              <img src="/analytics-icon.svg" class="icon-img"> Огляд тижня</span>
            </h3>
            <!-- display stats if data exists -->
            <ul class="summary-list" style="text-align: left" v-if="stats.tasksPlanned || stats.tasksCompleted || stats.eventsCount || stats.notesCount || stats.nearestEventTitle">
              <li><img src="/tasklist-icon.svg" class="icon-img"> Завдань заплановано: <strong>{{ stats.tasksPlanned }}</strong></li>
              <li><img src="/done-icon.svg" class="icon-img"> Виконано: <strong>{{ stats.tasksCompleted }}</strong></li>
              <hr />
              <li><img src="/calendar-icon.svg" class="icon-img"> Подій цього тижня: <strong>{{ stats.eventsCount }}</strong></li>
              <li><img src="/alarm-icon.svg" class="icon-img"> Найближча подія: <strong>{{ truncateText(stats.nearestEventTitle, 15) }}
                <span v-if="stats.nearestEventDate"> – </span>{{ stats.nearestEventDate }}</strong></li>
              <hr />
              <li><img src="/note-icon.svg" class="icon-img"> Збережених нотаток: <strong>{{ stats.notesCount }}</strong></li>
            </ul>
            <!-- message when no data -->
            <p style="text-align: center; padding: 1rem;" v-else>
              Поки що тут порожньо...<br/>
              Додайте задання або подію, щоб почати планувати свій час.
            </p>
          </div>
        </div>
        <!-- navigation cards linking to pages -->
        <div class="right-half">
          <div class="nav-cards">
            <router-link to="/tasks" class="nav-card">
              <img src="/tasklist-icon.svg" class="icon-img-card">
              <h3>Завдання</h3>
              <p>Керуйте завданнями</p>
            </router-link>
            <router-link to="/events" class="nav-card">
              <img src="/calendar-icon.svg" class="icon-img-card">
              <h3>Події</h3>
              <p>Плануйте свій розклад</p>
            </router-link>
            <router-link to="/notes" class="nav-card">
              <img src="/note-icon.svg" class="icon-img-card">
              <h3>Нотатки</h3>
              <p>Зберігайте думки та ідеї</p>
            </router-link>
            <router-link to="/audit-log" class="nav-card">
              <img src="/activity-history.svg" class="icon-img-card">
              <h3>Журнал активності</h3>
              <p>Переглядайте історію дій</p>
            </router-link>
          </div>
        </div>
        <!-- settings button -->
        <div class="fab-container">
          <button class="fab-main" @click="openSettings" aria-label="Відкрити налаштування" type="button">
            <img src="/settings-icon.svg" class="icon-img-btn">
          </button>
        </div>
      </template>
    </template>
  </div>

  <!-- settings modal -->
  <SettingsModal v-if="showSettingsModal" :visible="showSettingsModal" @close="closeSettings"/>
</template>

<script>
import bcrypt from 'bcryptjs';
import SettingsModal from './SettingsModal.vue';
export default {
  components: { SettingsModal },
  data() {
    return {
      pinRequired: false,
      pinInput: '',
      accessGranted: false,
      storedPinHash: null,
      loading: true,
      errorMessage: '',
      failedAttempts: 0,
      lockUntil: null,
      lockCountdown: 0,
      lockTimerId: null,
      showSettingsModal: false,
      stats: {
      tasksPlanned: 0,
      tasksCompleted: 0,
      eventsCount: 0,
      nearestEvent: 'немає',
      notesCount: 0,
    },
    };
  },
  methods: {
    // fetch security state
    async fetchSecurityState() {
      this.loading = true;
      try {
        const resSettings = await fetch('http://localhost:3000/settings');
        const settingsData = await resSettings.json();
        this.storedPinHash = settingsData.pin_hash || null;
        this.pinRequired = !!this.storedPinHash;
        const resSecurity = await fetch('http://localhost:3000/security/state');
        const securityData = await resSecurity.json();
        this.failedAttempts = securityData.failed_attempts || 0;
        this.lockUntil = securityData.lock_until || null;
        this.accessGranted = !!securityData.is_authorized;
        if (this.lockUntil && Date.now() < this.lockUntil) {
          this.startLockCountdown();
        } else {
          this.lockUntil = null;
        }
        if (this.accessGranted) {
          this.pinRequired = false;
        }
      } catch (err) {
        this.errorMessage = err.message;
      } finally {
        this.loading = false;
      }
    },
    // start lock countdown timer
    startLockCountdown() {
      this.updateLockCountdown();
      if (this.lockTimerId) clearInterval(this.lockTimerId);
      this.lockTimerId = setInterval(() => {
        this.updateLockCountdown();
      }, 1000);
    },
    // update remaining lock time
    updateLockCountdown() {
      const now = Date.now();

      if (!this.lockUntil || now >= this.lockUntil) {
        // lock expired
        this.lockCountdown = 0;
        this.lockUntil = null;
        clearInterval(this.lockTimerId);
        this.lockTimerId = null;
        this.failedAttempts = 0;
        this.errorMessage = '';
        this.updateSecurityState({ is_authorized: 0, failed_attempts: 0, lock_until: null });
      } else {
        this.lockCountdown = Math.ceil((this.lockUntil - now) / 1000);
      }
    },
    // update security state on backend
    async updateSecurityState(state) {
      try {
        await fetch('http://localhost:3000/security/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
      } catch (err) {}
    },
    // validate entered PIN code
    async checkPin() {
      if (!this.pinInput) {
        this.errorMessage = 'Введіть PIN-код';
        return;
      }
      if (this.lockUntil && Date.now() < this.lockUntil) {
        this.errorMessage = `Заблоковано. Спробуйте через ${this.lockCountdown} с.`;
        return;
      }

      // compare entered PIN with stored hash
      const isValid = await bcrypt.compare(this.pinInput, this.storedPinHash);

      if (isValid) {
        // access granted
        this.accessGranted = true;
        this.pinRequired = false;
        this.errorMessage = '';
        this.failedAttempts = 0;
        this.lockUntil = null;
        this.lockCountdown = 0;
        await this.updateSecurityState({ is_authorized: 1, failed_attempts: 0, lock_until: null });
      } else {
        // increase failed attempts count
        this.failedAttempts++;
        this.errorMessage = 'Неправильний PIN-код!';
        if (this.failedAttempts >= 3) {
          // lock for 1 minute
          this.lockUntil = Date.now() + 60000;
          this.errorMessage = 'Заблоковано на 1 хвилину через 3 невдалих спроби';
          this.startLockCountdown();
        }
        await this.updateSecurityState({ is_authorized: 0, failed_attempts: this.failedAttempts, lock_until: this.lockUntil });
      }
    },
    // fetch dashboard statistics
    async fetchStats() {
      try {
        const tasksRes = await fetch('http://localhost:3000/tasks');
        const tasks = await tasksRes.json();
        const eventsRes = await fetch('http://localhost:3000/events');
        const events = await eventsRes.json();
        const notesRes = await fetch('http://localhost:3000/notes');
        const notes = await notesRes.json();

        // calculate current week start and end
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        // tasks for this week
        const tasksThisWeek = tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate >= startOfWeek && taskDate <= endOfWeek;
        });

        // completed tasks this week
        const tasksCompletedThisWeek = tasksThisWeek.filter(t => t.status_name === 'complete');

        // events this week
        const eventsThisWeek = events.filter(event => {
          if (!event.start_time) {
            return false;
          }
          const eventStart = new Date(event.start_time);
          if (isNaN(eventStart)) {
            return false;
          }
          let eventEnd;
          if (event.end_time) {
            eventEnd = new Date(event.end_time);
            if (isNaN(eventEnd)) {
              return false;
            }
          } else {
            eventEnd = new Date(eventStart);
          }

          eventStart.setHours(0, 0, 0, 0);
          const hasTimeInEnd = event.end_time && /\d{2}:\d{2}/.test(event.end_time);

          if (!hasTimeInEnd) {
            eventEnd.setHours(23, 59, 59, 999);
          } else {
            eventEnd.setHours(0, 0, 0, 0);
          }

          const isInWeek = eventEnd >= startOfWeek && eventStart <= endOfWeek;
          return isInWeek;
        });

        // nearest upcoming event
        const nearest = events
        .filter(event => {
          if (!event.start_time) return false;
          const eventStart = new Date(event.start_time);
          eventStart.setHours(0, 0, 0, 0);
          return eventStart >= today;
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];
        
        // update stats
        this.stats = {
          tasksPlanned: tasksThisWeek.length,
          tasksCompleted: tasksCompletedThisWeek.length,
          eventsCount: eventsThisWeek.length,
          nearestEventTitle: nearest ? nearest.title : 'немає',
          nearestEventDate: nearest ? new Date(nearest.start_time).toLocaleDateString() : '',
          notesCount: notes.length,
        };
      } catch (err) {
        this.stats = {
          tasksPlanned: 0,
          tasksCompleted: 0,
          eventsCount: 0,
          nearestEvent: 'немає',
          notesCount: 0,
        };
      }
    },
    // truncate long text
    truncateText(text, maxLength = 20) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
    },
    // settings modal handlers
    openSettings() {
        this.showSettingsModal = true;
      },
    closeSettings() {
      this.showSettingsModal = false;
    },
  },
  // fetch security state and stats on mount
  mounted() {
    this.fetchSecurityState();
    this.fetchStats();
  },
  // cleanup timers before unmount
  beforeUnmount() {
    if (this.lockTimerId) {
      clearInterval(this.lockTimerId);
    }
  }
};
</script>

<style scoped>
.dashboard {
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
}

.right-half {
  background-color: var(--color-bg);
  position: fixed;
  top: 0;
  right: 0;
  width: 50vw;
  height: 100vh;
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  padding-right: 5vw;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 7%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.left-half {
  background-color: var(--color-bg);
  position: fixed;
  top: 0;
  left: 0;
  width: 50vw;
  height: 100vh;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  padding-left: 5vw;

}

.icon-image {
  max-width: 60%;
  height: auto;
  margin-bottom: 50px;
}

.nav-card {
  background-color: var(--color-accent-dark);
  border-radius: var(--radius);
  padding: 30px 25px;
  text-decoration: none;
  color: var(--color-text-light);
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
}

.nav-card:hover:not(.summary-card) {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.3);
}

.icon {
  font-size: 48px;
  margin-bottom: 15px;
}

h3 {
  margin: 10px 0 8px;
}

p {
  font-size: 15px;
  color: var(--color-text-light);
}

input {
  padding: 8px;
  font-size: 16px;
  margin-right: 10px;
  width: 150px;
}

button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
}


.summary-card {
  padding: 20px 25px;
  width: 70%;
  box-shadow: var(--shadow);
  text-align: left;
  color: var(--color-text-light);
}

.summary-card h3 {
  margin-bottom: 10px;
}

.summary-card p {
  font-size: 15px;
  color: var(--color-text-light);
}

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: var(--color-text-light);
  font-size: 16px;
}

.summary-list li {
  padding: 10px 0;
}

.summary-list hr {
  border-top: 1px solid var(--color-border);
  margin: 1% 0;
}

.fab-main {
  background-color: var(--color-button);
  color: var(--color-text-light);
}

.dashboard {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 1rem;
}

.pin-entry {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 1% 2%;
  width: 320px;
  text-align: center;
}

.pin-entry input {
  font-size: 1rem;
  padding: 0.6rem 0.8rem;
  margin-top: 1rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.pin-entry button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.8rem;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  background: var(--color-button);
  color: var(--color-text-light);
  cursor: pointer;
}

.pin-entry button:disabled {
  cursor: not-allowed;
}

.pin-entry p {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.warning {
  color: var(--color-delete);
  font-size: 16px !important;
}

.loading {
  font-family: inherit;
  font-size: 24px;
}
</style>