<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <!-- modal window -->
    <div class="modal-window">
      <h2>Налаштування</h2>

      <!-- theme selection -->
      <div class="setting-item">
        <label>Колір теми</label>
        <select v-model="settings.theme">
          <option value="green">Зелений</option>
          <option value="blue">Синій</option>
          <option value="pink">Рожевий</option>
          <option value="purple">Фіолетовий</option>
          <option value="orange">Помаранчевий</option>
          <option value="teal">Бірюзовий</option>
        </select>
      </div>

      <!-- PIN toggle -->
      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="pinEnabled" />
          Встановити PIN-код
        </label>
      </div>

      <!-- PIN input row -->
      <div class="setting-item" v-if="pinEnabled">
        <label for="pin">PIN-код</label>
        <div class="pin-input-row">
          <input id="pin" type="password" v-model="pin" placeholder="Введіть новий пін" maxlength="6" minlength="4"/>
          <button @click="savePin" type="button">Зберегти PIN</button>
          <button @click="deletePin" class="delete-pin-btn" type="button">Видалити PIN</button>
        </div>
      </div>

      <!-- modal action buttons -->
      <div class="modal-actions">
        <button @click="$emit('close')" type="button">Закрити</button>
        <button @click="saveSettings" type="submit" class="save-set-btn">Зберегти</button>
      </div>
    </div>
  </div>
</template>

<script>
import bcrypt from 'bcryptjs';
export default {
  props: ['visible'], // modal visibility toggle
  data() {
    return {
      settings: {
        theme: 'light', // current theme
      },
      pinEnabled: false, // is PIN enabled
      pin: '',
      storedPinHash: null, // hash from backend
    };
  },
  watch: {
    // load settings when modal becomes visible
    visible(newVal) {
      if (newVal) {
        this.loadSettings();
      }
    }
  },
  methods: {
    // fetch current settings from backend
    async loadSettings() {
      try {
        const res = await fetch('http://localhost:3000/settings');
        const data = await res.json();
        this.settings.theme = data.theme || 'light';
        this.pinEnabled = Boolean(data.pin_hash);
        this.storedPinHash = data.pin_hash || null;
        this.pin = '';
      } catch (err) {}
    },
    // save settings (theme + PIN) to backend
    async saveSettings() {
      // validate PIN length
      if (this.pinEnabled && this.pin && this.pin.length < 4) {
        return;
      }

      let pinHash = null;

      if (this.pinEnabled && this.pin) {
        const salt = bcrypt.genSaltSync(10);
        pinHash = bcrypt.hashSync(this.pin, salt);
      } else {
        pinHash = this.storedPinHash; // keep previous hash if no change
      }

      const payload = {
        theme: this.settings.theme,
        pin_hash: pinHash,
      };

      try {
        const res = await fetch('http://localhost:3000/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        this.$emit('theme-changed', this.settings.theme); // notify parent
        this.$emit('close'); // close modal
        window.location.reload(); // apply new theme
      } catch (err) { }
    },
    // save PIN separately
    async savePin() {
      await this.saveSettings();
    },
    // remove PIN
    async deletePin() {
      const payload = {
        theme: this.settings.theme,
        pin_hash: null,
      };
      
      try {
        const res = await fetch('http://localhost:3000/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        this.pin = '';
        this.pinEnabled = false;
        this.storedPinHash = null;
      } catch (err) {}
    },
  },
  mounted() {
    // initial load if modal visible
    if (this.visible) {
      this.loadSettings();
    }
  },
};
</script>

<style scoped>
.modal-window {
  background: white;
  padding: 20px;
  border-radius: 6px;
  max-width: 400px;
  width: 90vw;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.setting-item {
  margin-bottom: 20px;
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

.delete-pin-btn {
  background-color: var(--color-delete);
  color: var(--color-text-light);
}
.delete-pin-btn:hover:not(:disabled) {
  background-color: var(--color-delete);
}
.pin-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.pin-input-row input {
  flex-grow: 1;
  min-width: 0;
  padding: 6px 10px;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font-family: inherit;
  transition: border-color 0.25s ease;
}

.pin-input-row input:focus {
  outline: none;
  box-shadow: var(--shadow);
}

.pin-input-row button {
  flex-shrink: 0;
  height: 34px;
  padding: 0 12px;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background-color 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>