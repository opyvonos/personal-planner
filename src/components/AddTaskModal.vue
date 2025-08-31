<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window">
      <h2>Нове завдання</h2>
      <form @submit.prevent="submitTask">
        <!-- title input -->
        <div>
          <label>Назва завдання<span style="color:var(--color-delete)">*</span></label>
          <input v-model="title" type="text" required />
        </div>

        <!-- task description -->
        <div>
          <label>Опис</label>
          <textarea v-model="description"></textarea>
        </div>

        <!-- date and time row -->
        <div class="date-row">
          <div class="field-group">
            <label>Дата виконання</label>
            <input type="date" v-model="due_date" />
        </div>
          <div class="field-group">
            <label>Час виконання</label>
            <div class="time-input-wrapper">
              <input type="time" v-model="due_time" />
              <!-- clear time button -->
              <button type="button" @click="due_time = null" title="Очистити час">x</button>
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
      due_date: null,
      due_time: null,
      priority_level_id: null,
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
    // submit new task to backend
    async submitTask() {
      let due_datetime = null;

      // if time is set but no date, use today
      if (this.due_time && !this.due_date) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        this.due_date = `${yyyy}-${mm}-${dd}`;
      }

      // combine date and time
      if (this.due_date) {
        if (this.due_time) {
          // include time if set
          due_datetime = `${this.due_date}T${this.due_time}:00`;
        } else {
          due_datetime = this.due_date;
        }
      }

      // prepare task object for submission
      const task = {
        title: this.title,
        description: this.description,
        due_date: due_datetime,
        priority_level_id: this.priority_level_id,
      };

      try {
        const res = await fetch('http://localhost:3000/add-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
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