<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window">
      <h2>Редагувати подію</h2>
      <form @submit.prevent="submitEvent">
        <!-- title input -->
        <div>
          <label>Назва<span style="color:red">*</span></label>
          <input v-model="title" type="text" required/>
        </div>

        <!-- description -->
        <div>
          <label>Опис</label>
          <textarea v-model="description" />
        </div>

        <!-- date selection -->
        <div class="date-row">
          <div class="field-group">
            <label>Дата початку</label>
            <input type="date" v-model="startDate" />
          </div>
          <div class="field-group">
            <label>Дата завершення</label>
            <input type="date" v-model="endDate" :disabled="!startDate" :min="startDate" />
          </div>
        </div>

        <!-- time selection -->
        <div class="time-row">
          <div class="field-group time-group">
            <label>Час початку</label>
            <div class="time-input-wrapper">
              <input type="time" v-model="startTime" :disabled="!startDate" />
              <button type="button" @click="startTime = null" title="Очистити час" :disabled="!startDate">x</button>
            </div>
          </div>
          <div class="field-group time-group">
            <label>Час завершення</label>
            <div class="time-input-wrapper">
              <input type="time" v-model="endTime" :disabled="!startDate"
                :min="(endDate === null || endDate === '') || startDate === endDate ? startTime : null"/>
              <button type="button" @click="endTime = null" title="Очистити час" :disabled="!startDate">x</button>
            </div>
          </div>
        </div>

        <!-- priority selection -->
        <div>
          <label>Пріоритет</label>
          <select v-model.number="priority_level_id">
            <option :value="null">Немає</option>
            <option v-for="priority in priorities" :key="priority.priority_level_id" :value="priority.priority_level_id">
              {{ priority.name }}
            </option>
          </select>
        </div>

        <!-- modal action buttons -->
        <div class="modal-actions">
          <button type="button" class="delete-btn" @click="confirmDelete(event)" title="Видалити подію">
            <img src="/delete-icon.svg" class="icon-delete"></button>
          <button type="button" @click="$emit('close')">Скасувати</button>
          <button type="submit">Оновити</button>
        </div>
      </form>
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
</template>

<script>
export default {
  props: {
    event: Object, // event to edit
  },
  data() {
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      priority_level_id: null,
      priorities: [],
      eventToDelete: null,
      showDeleteConfirm: false,
    };
  },
  watch: {
    // reset fields if startDate cleared
    startDate(newVal) {
      if (!newVal) {
        this.endDate = '';
        this.startTime = '';
        this.endTime = '';
      }
    },
    event: {
      // initialize form when event prop changes
      handler(event) {
        if (!event) return;
        this.title = event.title || '';
        this.description = event.extendedProps?.description || '';
        this.priority_level_id = event.extendedProps?.priority || null;
        this.startDate = event.start?.split('T')[0] || '';
        this.startTime = event.start?.split('T')[1]?.slice(0, 5) || '';
        this.endDate = event.end?.split('T')[0] || '';
        this.endTime = event.end?.split('T')[1]?.slice(0, 5) || '';
      },
      immediate: true,
    },
  },
  methods: {
    // submit updated event to backend
    async submitEvent() {
      const start_time = this.startDate
      ? (this.startTime ? `${this.startDate}T${this.startTime}` : this.startDate) : null;
      let end_time = null;

      if (this.endDate) {
        end_time = this.endTime ? `${this.endDate}T${this.endTime}` : this.endDate;
      } else if (this.endTime && this.startDate) {
        end_time = `${this.startDate}T${this.endTime}`;
      }

      // prepare event object for submission
      const updated = {
        title: this.title,
        description: this.description,
        start_time,
        end_time,
        priority_level_id: this.priority_level_id,
      };

      try {
        await fetch(`http://localhost:3000/events/${this.event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        this.$emit('close', true);
      } catch (err) {}
    },
    // fetch priorities from backend
    async fetchPriorities() {
      try {
        const res = await fetch('http://localhost:3000/priorities');
        this.priorities = await res.json();
      } catch (error) {
        this.priorities = [];
      }
    },
    // truncate text for delete confirmation
    truncateText(text, maxLength = 20) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
    },
    // delete confirmation
    confirmDelete(event) {
      this.eventToDelete = event;
      this.showDeleteConfirm = true;
    },
    // cancel deletion
    cancelDelete() {
      this.eventToDelete = null;
      this.showDeleteConfirm = false;
    },
    // delete event
    async deleteEventConfirmed() {
      if (!this.eventToDelete) return;
      try {
        await fetch(`http://localhost:3000/events/${this.eventToDelete.id}`, {
          method: 'DELETE',
        });
        this.cancelDelete();
        this.$emit('close', true); // notify parent to refresh
      } catch (err) {}
    },
  },
  mounted() {
    this.fetchPriorities(); // load priorities on mount
  },
};
</script>

<style scoped>
button {
  cursor: pointer;
  font-weight: 600;
  padding: 0 14px;
  height: 34px;
  line-height: 34px;
  border-radius: 5px;
  border: none;
  font-size: 0.9rem;
  transition: background-color 0.25s ease;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>