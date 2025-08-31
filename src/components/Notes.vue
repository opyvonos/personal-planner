<template>
  <div class="notes-layout">
    <!-- sidebar with event controls -->
    <aside class="sidebar">
      <div class="header-with-button">
        <h3>Нотатки</h3>
        <!-- button to add a new note -->
        <button @click="showModal = true" class="add-note-btn">+ Нова нотатка</button>
      </div>

      <!-- search input -->
      <div class="search-wrapper">
        <input v-model="searchQuery" placeholder="Пошук нотаток..." class="search-input"/>
        <span v-if="searchQuery" class="clear-icon" @click="searchQuery = ''">✕</span>
      </div>

      <!-- labels list for filtering notes by label -->
      <div class="labels-list">
        <h4>Мітки</h4>
        <ul v-if="labels.length > 0">
          <li v-for="label in labels" :key="label.label_id" :class="{ active: selectedLabelId === label.label_id }"
          @click="toggleLabelFilter(label.label_id)">
            <span class="label-dot" :style="{ backgroundColor: label.color }"></span>
            <span>{{ truncateText(label.name, 20) }}</span>
            <button class="delete-label-btn" @click.stop="deleteLabel(label.label_id)" title="Видалити мітку">✕</button>
          </li>
          <!-- button to add a new label -->
          <li><button @click="showLabelModal = true" class="add-label-btn">+ мітка</button></li>
        </ul>
        <div v-else>
          <button @click="showLabelModal = true" class="add-label-btn">+ Додати мітку</button>
        </div>
      </div>
    </aside>

    <!-- main content area showing notes -->
    <div class="main-content">
      <div class="notes-header">
        <!-- modal for creating a new label -->
        <div v-if="showLabelModal" class="modal-backdrop" @click.self="showLabelModal = false">
          <div class="modal-window">
            <h3>Нова мітка</h3>
            <form @submit.prevent="submitLabel">
              <div>
                <label>Назва<span style="color:red">*</span></label>
                <input v-model="newLabel.name" required type="text"/>
              </div>
              <div>
                <label>Колір</label>
                <input type="color" v-model="newLabel.color" required />
              </div>
              <div class="modal-actions">
                <button type="button" @click="handleLabelModalClose" class="delete-cancel">Скасувати</button>
                <button type="submit" class="save-btn">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- notes grid -->
      <div class="notes-grid" v-if="notesWithLabels.length">
      <div v-for="note in notesWithLabels" :key="note.note_id" class="note-card"
        :style="{ backgroundColor: note.color || '#fff', color: getTextColor(note.color || '#fff') }" @click="openNoteModal(note)">
      <!-- note label -->
      <div v-if="note.labelName" class="note-label"
        :style="{ backgroundColor: note.labelColor || '#999', color: getTextColor(note.labelColor || '#999') }" @click.stop>
        🏷 {{ truncateText(note.labelName, 15) }}
      </div>
        <h3>{{ truncateText(note.title, 10) }}</h3>
        <p class="note-content">{{ truncateText(note.content, 100) }}</p>
        <div class="note-meta">
          <small>{{ formatDate(note.updated_at) }}</small>
        </div>
      </div>
    </div>

    <!-- empty state when no notes -->
    <div v-else class="empty-state">
      <img src="/inbox-icon.svg" class="icon-tasks">
      <p>Нотаток поки що немає</p>
    </div>

    <!-- modal to view/edit a note -->
    <ViewNoteModal v-if="showNoteModal" :note="selectedNote" :labels="labels"
      @close="closeNoteModal" @updated="handleNoteUpdated" @deleted="handleNoteDeleted"/>
      <!-- modal to add a new note -->
      <AddNoteModal v-if="showModal" @close="handleModalClose" />
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
import AddNoteModal from './AddNoteModal.vue';
import ViewNoteModal from './ViewNoteModal.vue';
import SettingsModal from './SettingsModal.vue';

export default {
  components: { AddNoteModal, ViewNoteModal, SettingsModal },
  data() {
    return {
      // all notes stored locally
      notes: [],
      // list of labels
      labels: [],
      searchQuery: '',
      // modal visibility flags
      showModal: false,
      showLabelModal: false,
      newLabel: {
        name: '',
        color: '#ffffff'
      },
      showNoteModal: false,
      selectedNote: null,
      selectedLabelId: null,
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
    };
  },
  computed: {
    // filter notes based on search query and selected label
    filteredNotes() {
      const q = this.searchQuery.toLowerCase();

      return this.notes
        .filter(note => {
          const matchesSearch = (note.title?.toLowerCase().includes(q) || note.content?.toLowerCase().includes(q));
          const matchesLabel = this.selectedLabelId === null || note.label_id === this.selectedLabelId;
          return matchesSearch && matchesLabel;
        })
        // sort notes by last updated date descending
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      },
      // attach label info (name, color) to each note
      notesWithLabels() {
        return this.filteredNotes.map(note => {
          const label = this.labels.find(l => l.label_id === note.label_id);
          return {
            ...note,
            labelName: label ? label.name : null,
            labelColor: label ? label.color : null,
          };
        });
      },
    },
    methods: {
      // fetch notes from backend
      async fetchNotes() {
        try {
          const res = await fetch('http://localhost:3000/notes');
          this.notes = await res.json();
        } catch (err) {}
      },
      // format date for display
      formatDate(dateStr) {
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
      // submit new label to backend
      async submitLabel() {
        try {
          const res = await fetch('http://localhost:3000/add-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.newLabel)
          });
          const data = await res.json();
          // reset new label form
          this.newLabel.name = '';
          this.newLabel.color = '#ffffff';
          this.showLabelModal = false;
          this.fetchLabels();
        } catch (err) {}
      },
      // fetch labels from backend
      async fetchLabels() {
        try {
          const res = await fetch('http://localhost:3000/labels');
          const data = await res.json();
          this.labels = data.labels;
        } catch (err) {}
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
      // delete label
      async deleteLabel(label_id) {
        try {
          await fetch(`http://localhost:3000/labels/${label_id}`, {
            method: 'DELETE'
          });
          if (this.selectedLabelId === label_id) {
            this.selectedLabelId = null;
          }
          this.fetchLabels();
          this.fetchNotes();
        } catch (err) {}
      },
      // floating action button
      toggleMenu() {
        this.isOpen = !this.isOpen;
      },
      // toggle filter by label
      toggleLabelFilter(labelId) {
        this.selectedLabelId = this.selectedLabelId === labelId ? null : labelId;
      },
      // open modal to view/edit a note
      openNoteModal(note) {
        this.selectedNote = note;
        this.showNoteModal = true;
      },
      // close note modal
      closeNoteModal() {
        this.showNoteModal = false;
        this.selectedNote = null;
      },
      // modal handlers
      handleNoteUpdated() {
        this.fetchNotes();
        this.fetchLabels();
      },
      handleNoteDeleted() {
        this.fetchNotes();
      },
      handleModalClose() {
        this.showModal = false;
        this.fetchNotes();
        this.fetchLabels();
      },
      handleLabelModalClose() {
        this.newLabel.name = '';
        this.newLabel.color = '#ffffff';
        this.showLabelModal = false;
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
      // fetch initial data
      this.fetchNotes();
      this.fetchLabels();
      // ensure selected label exists
      if (!this.labels.find(label => label.label_id === this.selectedLabelId)) {
        this.selectedLabelId = null;
      }
    },
  };
</script>

<style scoped>
.notes-layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.add-note-btn {
  background: var(--color-button);
  color: var(--color-bg);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.notes-grid {
  column-count: 4;
  column-gap: 20px;
}

.note-card {
  display: inline-block;
  width: 100%;
  margin-bottom: 16px;
}

.note-card {
  padding: 16px;
  box-shadow: var(--shadow);
  transition: var(--transition);
  cursor: pointer;
  border-radius: 6px;
}

.note-card:hover {
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.3);
}

.note-content {
  margin-top: 8px;
  white-space: pre-wrap;
}

.note-meta {
  margin-top: 12px;
  text-align: right;
  font-size: 0.8em;
}

.note-content {
  white-space: normal;
  line-height: 24px;
  max-height: calc(24px * 5);
  overflow: hidden;
  word-break: break-word;
}

.modal-window {
  width: 100px;
  background: white;
  padding: 20px;
  width: 300px;
  border-radius: 10px;
}

.note-card h3 {
  margin-top: 5px;
  margin-bottom: 10px;
}

.note-content {
  margin-bottom: 0 !important;
  border-radius: 0 !important;
}

.note-card {
  position: relative;
}

.note-label {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  user-select: none;
  cursor: default;
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
}

.labels-list ul {
  list-style: none;
  padding: 0;
  margin: 10px 0 20px;
}

.labels-list li {
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.labels-list li.active {
  background-color: var(--color-accent-light);
  color: var(--color-text-dark);
  font-weight: bold;
}

.label-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.delete-label-btn {
  background: transparent;
  border: none;
  color: var(--color-delete);
  font-size: 0.9rem;
  cursor: pointer;
  margin-left: auto;
  padding: 0 4px;
  transition: color 0.2s ease;
}

h4 {
  margin: 10px;
}
.header-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .sidebar {
    flex: 0 0 auto;
    width: 100%;
    height: auto;
    box-shadow: none;
  }
  .notes-layout {
    flex-direction: column;
  }
  .main-content {
    flex: 1 1 auto;
    width: 100%;
  }
}

.delete-cancel, .save-btn {
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