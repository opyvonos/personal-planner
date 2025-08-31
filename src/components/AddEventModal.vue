<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window">
      <h2>Нова подія</h2>
      <form @submit.prevent="submitEvent">
        <!-- title input -->
        <div>
          <label>Назва<span style="color:red">*</span></label>
          <input v-model="title" type="text" required />
        </div>

        <!-- toggle advanced options -->
        <div style="margin: 10px 0;">
          <button type="button" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Сховати деталі' : 'Додати більше...' }}
          </button>
        </div>

        <!-- advanced fields -->
        <div v-if="showAdvanced" class="advanced-fields">
          <div>
            <label>Опис</label>
            <textarea v-model="description"></textarea>
          </div>

          <!-- date selection -->
          <div class="date-row">
            <div class="field-group">
              <label>Дата початку</label>
              <input type="date" v-model="startDate" />
            </div>
            <div class="field-group">
              <label :class="{ disabledLabel: !startDate }">Дата завершення</label>
              <input type="date" v-model="endDate" :disabled="!startDate" :min="startDate" />
            </div>
          </div>
          <div>

            <!-- time toggle -->
            <label :class="{ disabledLabel: !startDate }">
              <input type="checkbox" v-model="includeTime" :disabled="!startDate" />Додати час
            </label>
          </div>
          <!-- time inputs -->
          <div v-if="includeTime" class="time-row">
            <div class="field-group time-group">
              <label>Час початку</label>
              <div class="time-input-wrapper">
                <input type="time" v-model="startTime" :disabled="!startDate" />
                <button type="button" @click="startTime = null" title="Очистити час" :disabled="!startDate">x</button>
              </div>
            </div>
            <div v-if="includeTime" class="field-group time-group">
              <label>Час завершення</label>
              <div class="time-input-wrapper">
                <input type="time" v-model="endTime" :disabled="!startDate"
                  :min="(endDate === null || endDate === '') || startDate === endDate ? startTime : null"/>
                <!-- clear time button -->
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
        </div>
        
        <!-- modal action buttons -->
        <div class="modal-actions">
          <button type="button" @click="$emit('close')">Скасувати</button>
          <button type="submit">Зберегти</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      includeTime: false,
      startTime: '',
      endTime: '',
      priority_level_id: null,
      repeat: '',
      showAdvanced: false,
      priorities: [],
    };
  },
  methods: {
    // fetch priorities from backend
    async fetchPriorities() {
      try {
        const res = await fetch('http://localhost:3000/priorities');
        this.priorities = await res.json();
      } catch (error) {
        this.priorities = [];
      }
    },
    // submit event to backend
    async submitEvent() {
      // prevent invalid date range
      if (this.endDate && this.endDate < this.startDate) {
        return;
      }

      let start_time = null;
      let end_time = null;

      if (this.startDate) {
        if (this.includeTime) {
          // include time in datetime strings
          start_time = `${this.startDate}T${this.startTime || '00:00'}`;
          end_time = this.endDate
            ? `${this.endDate}T${this.endTime || '23:59'}`
            : `${this.startDate}T${this.endTime || '23:59'}`;
          } else {
            // only date, no time
            start_time = this.startDate;
            end_time = this.endDate || null;
          }
        }

      // prepare event object for submission
      const event = {
        title: this.title,
        description: this.description,
        start_time,
        end_time,
        priority_level_id: this.priority_level_id,
      };

      try {
        // send POST request to backend
        const res = await fetch('http://localhost:3000/add-event', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(event),
        });
        const data = await res.json();
        this.$emit('close'); // close modal after submit
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
