<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window" :style="!isEditMode ? { backgroundColor: note.color } : {}">

      <!-- note view mode -->
      <div v-if="!isEditMode" class="note-view-container">
      <!-- label badge -->
        <div v-if="note.labelName" class="note-label" :style="{ backgroundColor: note.labelColor, color: getTextColor(note.labelColor) }">
          🏷 {{ note.labelName }}
        </div>
        <!-- note title -->
        <h2 :style="{ color: getTextColor(note.color) }">{{ truncateText(note.title, 30) || 'Без назви' }}</h2>
        <!-- note content -->
        <p class="note-content" :style="{ color: getTextColor(note.color) }">{{ note.content || 'Немає тексту' }}</p>
        <!-- last updated info -->
        <small :style="{ color: getTextColor(note.color) }">Останнє оновлення: {{ formatDate(note.updated_at) }}</small>

        <!-- modal action -->
        <div class="modal-actions" style="margin-top: 20px;">
          <button type="button" @click="confirmDelete(note)" class="delete-btn"><img src="/delete-icon.svg" class="icon-delete"></button>
          <button type="button" @click="$emit('close')">Закрити</button>
          <button type="button" @click="enterEditMode" class="edit-btn">Редагувати</button>
        </div>

        <!-- delete confirmation modal -->
        <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
          <div class="delete-confirm-box">
          <p :style="{ color: getTextColor(note.color) }">Ви дійсно хочете видалити цю нотатку?</p>
          <div class="modal-actions">
            <button @click="cancelDelete">Скасувати</button>
            <button @click="deleteNoteConfirmed" class="confirm-btn">Так, видалити</button>
          </div>
        </div>
      </div>
    </div>

    <!-- edit mode form -->
    <form v-else @submit.prevent="submitUpdate">
      <div class="field-group">
        <label for="title">Назва</label>
        <input id="title" type="text" v-model="form.title" />
      </div>

      <!-- content input -->
      <div class="field-group">
        <label for="content">Текст</label>
        <textarea id="content" v-model="form.content" rows="6"></textarea>
      </div>

      <!-- color and label selection -->
      <div class="row-inline"> 
          <div class="field color-field">
            <label for="color">Колір</label>
            <div class="color-control">
              <input id="color" type="color" v-model="form.color" />
              <button type="button" class="clear-color-btn" @click="form.color = '#ffffff'" title="Очистити колір">x</button>
            </div>
          </div>
          <div class="field" style="flex: 1;">
            <label for="label">Мітка</label>
            <select id="label" v-model="form.label_id">
              <option :value="null">Без мітки</option>
              <option v-for="label in labels" :key="label.label_id" :value="label.label_id">
                {{ label.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- modal action buttons -->
        <div class="modal-actions">
          <button type="button" @click="cancelEdit">Скасувати</button>
          <button type="submit">Зберегти</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    note: {
      type: Object,
      required: true, // note object required
    },
    labels: {
      type: Array,
      default: () => [], // list of available labels
    },
  },
  data() {
    return {
      isEditMode: false, // toggle edit/view mode
      form: {
        title: '',
        content: '',
        color: '#ffffff',
        label_id: null,
      },
      showDeleteConfirm: false,
      noteToDelete: null,
    };
  },
  methods: {
    // enter edit mode and prefill form
    enterEditMode() {
      this.isEditMode = true;
      this.form.title = this.note.title || '';
      this.form.content = this.note.content || '';
      this.form.color = this.note.color || '#ffffff';
      this.form.label_id = this.note.label_id || null;
    },
    // cancel edit and revert
    cancelEdit() {
      this.isEditMode = false;
    },
    // format date for display
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);

      return date.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    // truncate long text
    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength).trimEnd() + '...';
    },
    // determine if color is light
    isColorLight(color) {
      // if no color is provided, background іs light
      if (!color) return true;
      // get RGB channel values in decimal
      const r = parseInt(color.substr(1, 2), 16);
      const g = parseInt(color.substr(3, 2), 16);
      const b = parseInt(color.substr(5, 2), 16);
      // calculate brightness
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      // compare against threshold
      return yiq > 128;
    },
    // get readable text color based on background
    getTextColor(bgColor) {
      return this.isColorLight(bgColor) ? '#000000' : '#ffffff';
    },
    // submit updated note to backend
    async submitUpdate() {
      try {
        const updatedNote = {
          ...this.form,
          note_id: this.note.note_id,
        };

        const res = await fetch(`http://localhost:3000/notes/${updatedNote.note_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedNote),
        });
        this.isEditMode = false;
        this.$emit('updated'); // notify parent
        this.$emit('close'); // close modal
      } catch (err) {}
    },
    // delete confirmation
    confirmDelete(note) {
      this.noteToDelete = note;
      this.showDeleteConfirm = true;
    },
    // cancel deletion
    cancelDelete() {
      this.noteToDelete = null;
      this.showDeleteConfirm = false;
    },
    // confirm deletion and call backend
    async deleteNoteConfirmed() {
      if (!this.noteToDelete) return;
      try {
        await fetch(`http://localhost:3000/notes/${this.noteToDelete.note_id}`, {
          method: 'DELETE',
        });
        this.cancelDelete();
        this.$emit('deleted'); // notify parent
        this.$emit('close'); // close modal
      } catch (err) {}
    },
  },
};
</script>

<style scoped>
.modal-window {
  position: relative;
  background: white;
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  padding: 20px;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-y: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.note-label {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 0 5px rgba(0,0,0,0.2);;
}

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
  white-space: pre-wrap;
  word-wrap: break-word;
}

.row-inline {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
}

.color-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-color-btn {
  font-size: 0.85rem;
  border-radius: 6px;
  border: none;
  background-color: transparent;
  color: #000;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-btn, .confirm-btn {
  background: var(--color-button);
  color: var(--color-text-light);
}

.edit-btn:hover {
  background-color: var(--color-hover) !important;
}
</style>