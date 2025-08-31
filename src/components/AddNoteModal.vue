<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window">
      <h2>Нова нотатка</h2>
      <form @submit.prevent="submitNote">
        <!-- title input -->
        <div>
          <label>Назва</label>
          <input v-model="title" type="text" />
        </div>

        <!-- note content -->
        <div>
          <label>Текст...</label>
          <textarea v-model="content"></textarea>
        </div>

        <!-- color selection -->
        <div class="row-inline">
          <!-- color picker -->
          <div class="field color-field">
            <label>Колір</label>
            <div class="color-control">
              <input type="color" v-model="color"  />
              <!-- reset color button -->
              <button type="button" class="clear-color-btn" @click="color = '#ffffff'" title="Очистити колір">x</button>
            </div>
          </div>

          <!-- label selection -->
          <div class="field" style="flex: 1;">
            <label>Мітка</label>
            <select v-model="label_id">
              <option :value="null">Без мітки</option>
              <option v-for="label in labels" :key="label.label_id" :value="label.label_id">
                {{ label.name }}
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
      content: null,
      color: '#ffffff',
      label_id: null,
      labels: []
    };
  },
  created() {
    this.fetchLabels(); // load labels when component is created
  },
  methods: {
    // fetch labels from backend
    async fetchLabels() {
      try {
        const res = await fetch('http://localhost:3000/labels');
        const data = await res.json();
        this.labels = data.labels;
      } catch (err) {}
    },
    // submit new note to backend
    async submitNote() {
      // prepare note object for submission
      const note = {
        title: this.title,
        content: this.content,
        color: this.color,
        label_id: this.label_id
      };
      
      try {
        const res = await fetch('http://localhost:3000/add-note', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(note),
        });
        this.$emit('close'); // close modal after submit
      } catch (err) {}
    },
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

textarea {
  min-height: 160px;
}

.clear-color-btn {
  font-size: 0.85rem;
  border-radius: var(--radius);
  border: none;
  background-color: #ffffff00;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
</style>