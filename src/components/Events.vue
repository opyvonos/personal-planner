<template>
  <div class="main-layout">
    <!-- sidebar with event controls -->
    <aside class="sidebar">
      <div class="header-with-button">
        <h3>Події</h3>
        <!-- button to add a new event -->
        <button @click="showModal = true" class="add-event-btn">+ Нова подія</button>
      </div>

      <!-- modal for adding a new event -->
      <AddEventModal v-if="showModal" @close="handleModalClose" />

      <!-- search input -->
      <div class="search-wrapper">
        <input type="text" v-model="searchQuery" class="search-input" placeholder="Пошук подій..."/>
        <span v-if="searchQuery" class="clear-icon" @click="searchQuery = ''">✕</span>
      </div>

      <!-- filter events -->
      <select v-model="eventFilter">
        <option value="all">Усі події</option>
        <option value="future">Майбутні</option>
        <option value="today">Сьогодні</option>
        <option value="week">Тиждень</option>
        <option value="no-date">Без дати</option>
      </select>

      <!-- sorting controls -->
      <div class="sort-controls">
        <div class="sort-group">
          <span class="sort-label-text">Сортувати за</span>
          <select v-model="sortBy" class="sort-select">
            <option value="date">датою</option>
            <option value="priority">пріоритетом</option>
          </select>
          <label class="order-icon" title="Порядок">
          <select v-model="sortOrder" class="order-select">
            <option value="asc" title="Зростання">↑</option>
            <option value="desc" title="Спадання">↓</option>
          </select>
          </label>
        </div>
      </div>

      <!-- event list -->
      <ul class="event-list">
        <li v-if="filteredEvents.length === 0" class="no-events">Подій поки немає</li>
        <li v-for="event in filteredEvents" :key="event.id">
          <div class="event-title">
          <!-- priority indicator dot -->
            <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(event.extendedProps.priority) }"></span>
            <span class="event-title-text">{{ event.title }}</span>
          </div>
          <!-- optional description -->
          <div v-if="event.extendedProps.description" class="event-descr">
            {{ event.extendedProps.description }}
          </div>
          <!-- event start date -->
          <div v-if="event.start">
            <img src="/calendar-dark-icon.svg" class="icon-event-img"> {{ formatDateTime(event.start) }}
          </div>
          <!-- event end date -->
          <div v-if="event.end">
            <img src="/hourglass-icon.svg" class="icon-event-img"> {{ formatDateTime(event.end) }}
          </div>
          <!-- edit and delete buttons -->
          <div class="btns-container">
            <button @click="openEditModal(event)" class="edit-btn"><img src="/edit-icon.svg" class="icon-img"></button>
            <button @click="confirmDelete(event)" class="delete-btn"><img src="/delete-icon.svg" class="icon-img"></button>
          </div>
        </li>
      </ul>

      <!-- modal for editing an event -->
      <EditEventModal v-if="showEditModal" :event="currentEvent" @close="handleEditModalClose"/>
    </aside>

    <!-- calendar display -->
    <div class="calendar-container">
      <FullCalendar ref="fullCalendar" :options="calendarOptions" />
    </div>

    <!-- delete confirmation modal -->
    <div v-if="showDeleteConfirm" class="delete-confirm">
        <div class="confirm-box">
          <p>Видалити подію "{{ truncateText(eventToDelete?.title) }}"?</p>
          <button @click="cancelDelete">Ні</button>
          <button @click="deleteEventConfirmed">Так</button>
        </div>
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
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ukLocale from '@fullcalendar/core/locales/uk';
import AddEventModal from './AddEventModal.vue';
import EditEventModal from './EditEventModal.vue';
import SettingsModal from './SettingsModal.vue';

export default {
  components: { FullCalendar, AddEventModal, EditEventModal, SettingsModal },
  data() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return {
      // priority levels fetched from server
      priorities: [],
      // modal visibility flags
      showModal: false,
      showEditModal: false,
      currentEvent: null,
      showDeleteConfirm: false,
      eventToDelete: null,
      // all events stored locally
      allEvents: [],
      eventFilter: 'all',
      // fullcalendar configuration
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        locale: ukLocale,
        allDaySlot: false,
        events: [],
        eventDidMount: this.eventDidMount,
        nowIndicator: true,
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        },
      eventClick: this.handleEventClick,
      defaultTimedEventDuration: '00:00',

      datesSet: (info) => {
        // update calendar size on view change
        this.$nextTick(() => {
          if (this.$refs.fullCalendar && this.$refs.fullCalendar.getApi) {
            this.$refs.fullCalendar.getApi().updateSize();
          }});
        },
      },
      // search and sorting
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
      // reminders
      remindedEventIds: new Set(),
      reminderTimeouts: [],
      sortBy: 'date',
      sortOrder: 'asc',
    };
  },
  computed: {
    // filtered and sorted events based on search and filters
    filteredEvents() {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);

      monday.setHours(0, 0, 0, 0);
      monday.setDate(now.getDate() - diffToMonday);

      const sunday = new Date(monday);

      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      let filtered = this.allEvents.filter(e => {
        // filter events with no date
        if (this.eventFilter === 'no-date' && e.start) return false;
        // filter events for today
        if (this.eventFilter === 'today') {
          if (!e.start) return false;
          const eventDate = new Date(e.start);
          if (
            eventDate.getFullYear() !== now.getFullYear() ||
            eventDate.getMonth() !== now.getMonth() ||
            eventDate.getDate() !== now.getDate()
          ) {
            return false;
          }
        }
        // filter future events
        if (this.eventFilter === 'future') {
          if (!e.start) return false;
          const eventDate = new Date(e.start);
          if (eventDate <= now) return false;
        }
        // filter events this week
        if (this.eventFilter === 'week') {
          if (!e.start) return false;
          const eventDate = new Date(e.start);
          if (eventDate < monday || eventDate > sunday) return false;
        }
        // filter by search query
        if (this.searchQuery) {
          return e.title.toLowerCase().includes(this.searchQuery.toLowerCase());
        }
        return true;
      });

      // sort filtered events
      return this.sortEvents(filtered, this.sortBy, this.sortOrder);
    },
  },
  methods: {
    // fetch events from backend
    async fetchEvents() {
      try {
        const res = await fetch('http://localhost:3000/events');
        const data = await res.json();

        const parsedEvents = data.map(e => {
          let endDate = e.end_time;
          let calendarEndDate = endDate;
          // ensure calendar displays full-day events correctly
          if (endDate && !endDate.includes('T')) {
            const d = new Date(endDate);
            const dNext = new Date(d);
            dNext.setDate(dNext.getDate() + 1);
            endDate = d.toISOString().slice(0, 10);
            calendarEndDate = dNext.toISOString().slice(0, 10);
          }

          return {
            id: e.event_id,
            title: e.title,
            start: e.start_time,
            end: endDate,
            calendarEnd: calendarEndDate,
            extendedProps: {
              description: e.description,
              priority: e.priority_level_id,
            },
            color: this.getPriorityColor(e.priority_level_id),
          };
        });

        this.allEvents = parsedEvents;
        // set events for fullcalendar
        this.calendarOptions.events = parsedEvents.filter(e => e.start).map(e => ({
          ...e,
          end: e.calendarEnd || e.end,
        }));
        // schedule reminders for events
        this.scheduleReminders();
      } catch (err) {}
    },
    // fetch priorities for events
    async fetchPriorities() {
      try {
        const res = await fetch('http://localhost:3000/priorities');
        const priorities = await res.json();
        this.priorities = priorities;
        return priorities;
      } catch (err) {
        return [];
      }
    },
    // style events when they are rendered on the calendar
    eventDidMount(info) {
      const now = new Date();
      const start = info.event.start;
      const end = info.event.end || info.event.start;
      const priorityId = info.event.extendedProps.priority;
      const baseColor = this.getPriorityColor(priorityId);

      // past events appear faded
      if (end < now) {
        info.el.style.backgroundColor = baseColor;
        info.el.style.opacity = '0.7';
        info.el.style.filter = 'grayscale(25%)';
      }
      // ongoing events highlighted
      else if (start <= now && now <= end) {
        info.el.style.backgroundColor = baseColor;
        info.el.style.opacity = '1';
        info.el.style.filter = 'none';
        info.el.style.fontWeight = '700';
        info.el.style.boxShadow = `0 0 8px ${baseColor}`;
      }
      // future events normal style
      else {
        info.el.style.backgroundColor = baseColor;
        info.el.style.opacity = '1';
        info.el.style.filter = 'none';
        info.el.style.fontWeight = 'normal';
        info.el.style.boxShadow = 'none';
      }
      this.styleEvent(info);
    },
    // add tooltip info to event elements
    styleEvent(info) {
      let title = '';

      if (info.event.title) {
        title += `Назва: ${info.event.title}\n`;
      }
      if (info.event.extendedProps.description) {
        title += `Опис: ${info.event.extendedProps.description}\n`;
      }

      const priorityId = info.event.extendedProps.priority;
      const priorityText = this.priorityLabel(priorityId) || 'Без пріоритету';
      title += `\nПріоритет: ${priorityText}\n`;

      if (info.event.start) {
        const startDate = new Date(info.event.start);
        const hasTime = startDate.getHours() !== 0 || startDate.getMinutes() !== 0;
        title += '\nПочаток: ' + startDate.toLocaleDateString();
        if (hasTime) {
          title += ', ' + startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
      if (info.event.end) {
        const endDate = new Date(info.event.end);
        const hasTime = endDate.getHours() !== 0 || endDate.getMinutes() !== 0;
        title += '\nЗавершення: ' + endDate.toLocaleDateString();
        if (hasTime) {
          title += ', ' + endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
      if (title) {
        info.el.setAttribute('title', title.trim());
      }
    },
    // format date and date-time for display
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long' });
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return d.toLocaleString('uk-UA', { 
          day: '2-digit', month: 'long',
          hour: '2-digit', minute: '2-digit'
        });
      } else {
        const d = new Date(dateStr);
        return d.toLocaleDateString('uk-UA', {
          day: '2-digit', month: 'long',
        });
      }
    },
    // helper functions for priorities
    priorityLabel(priorityId) {
      const priority = this.priorities.find(p => p.priority_level_id === priorityId);
      return priority ? priority.name : 'Невідомий';
    },
    getPriorityColor(priorityId) {
      const priority = this.priorities.find(p => p.priority_level_id === priorityId);
      return priority ? priority.color : '#a8a8a8';
    },
    // sort events by date or priority
    sortEvents(events, sortBy, order) {
      return events.slice().sort((a, b) => {
        let compare = 0;
        if (sortBy === 'date') {
          const dateA = a.start ? new Date(a.start).getTime() : Infinity;
          const dateB = b.start ? new Date(b.start).getTime() : Infinity;
          compare = dateA - dateB;
        } else if (sortBy === 'priority') {
          const priorityA = a.extendedProps.priority || 0;
          const priorityB = b.extendedProps.priority || 0;
          compare = priorityA - priorityB;
        }
        return order === 'asc' ? compare : -compare;
      });
    },
    // modal handlers
    handleModalClose() {
      this.showModal = false;
      this.fetchEvents();
    },
    openEditModal(event) {
      this.currentEvent = event;
      this.showEditModal = true;
    },
    handleEditModalClose() {
      this.showEditModal = false;
      this.fetchEvents().then(() => {
        const calendarApi = this.$refs.fullCalendar.getApi();
        calendarApi.removeAllEvents();
        this.calendarOptions.events.forEach(event => calendarApi.addEvent(event));
      });
    },
    // delete event modal handlers
    confirmDelete(event) {
      this.eventToDelete = event;
      this.showDeleteConfirm = true;
    },
    cancelDelete() {
      this.eventToDelete = null;
      this.showDeleteConfirm = false;
    },
    async deleteEventConfirmed() {
      if (!this.eventToDelete) return;
      try {
        await fetch(`http://localhost:3000/events/${this.eventToDelete.id}`, {
          method: 'DELETE',
        });
        this.cancelDelete();
        this.fetchEvents();
      } catch (err) {}
    },
    // handle clicking an event in the calendar
    handleEventClick(info) {
      const clickedEventId = info.event.id;
      const foundEvent = this.allEvents.find(e => e.id == clickedEventId);
      if (foundEvent) {
        this.currentEvent = foundEvent;
        this.showEditModal = true;
      }
    },
    // floating action button
    toggleMenu() {
      this.isOpen = !this.isOpen;
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
    // schedule reminders for events
    scheduleReminders() {
      this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
      this.reminderTimeouts = [];
      this.remindedEventIds = new Set();
      const now = Date.now();

      this.allEvents.forEach(event => {
        if (!event.start) return;
        const startTime = new Date(event.start).getTime();
        const oneHourBefore = startTime - 60 * 60 * 1000;

        // reminder 1 hour before
        if (oneHourBefore > now && !this.remindedEventIds.has(`${event.id}-1h`)) {
          const timeoutId = setTimeout(() => {
          this.showToast(`⏰ За годину почнеться: "${event.title.length > 20 ? event.title.slice(0,17) + '...' : event.title}"`);
          this.remindedEventIds.add(`${event.id}-1h`);
        }, oneHourBefore - now);
        this.reminderTimeouts.push(timeoutId);
      }
      // reminder at start
      if (startTime > now && !this.remindedEventIds.has(`${event.id}-start`)) {
        const timeoutId = setTimeout(() => {
          this.showToast(`🚨⏰ Подія: "${event.title.length > 20 ? event.title.slice(0,17) + '...' : event.title}" розпочалась`);
          this.remindedEventIds.add(`${event.id}-start`);
        }, startTime - now);
        this.reminderTimeouts.push(timeoutId);
      }});
    },
    // truncate text for display
    truncateText(text, maxLength = 20) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
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
    // load priorities first, then fetch events
    this.fetchPriorities().then(() => {
      this.fetchEvents();
    });
  },
};
</script>

<style>
.fc-daygrid-event-dot {
  display: none !important;
}

div.fc-event-title.fc-sticky {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fc-timegrid .fc-event-title.fc-sticky {
  max-width: 100% !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}

.fc-timegrid-event .fc-event-title {
  white-space: normal !important;
  overflow: hidden !important;
  text-overflow: clip !important;
  word-break: normal !important;
  word-wrap: break-word !important;
  height: auto !important;
}
div.fc-event-title.fc-sticky {
  padding: 0; 
  width: 100% !important;
}

.fc-event-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 24px;
  box-sizing: border-box;
}

.fc-timegrid-event .fc-event-title {
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: normal !important;
  hyphens: auto !important;
  overflow: visible !important;
  text-overflow: clip !important;
  height: auto !important;
  padding: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.fc-timegrid-event .fc-event-title {
  max-width: 100% !important;
}

.fc-timegrid-event .fc-event-time {
  font-size: 13px !important;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 4px;
}

.fc-timegrid-event {
  min-height: 40px !important;
}

.header-with-button {
  flex-wrap: wrap;
}

.sort-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.sort-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.sort-label-text {
  white-space: nowrap;
}

.sort-select,
.order-select {
  max-width: 100px;
  width: auto;
  flex: 1 1 auto;
}
</style>