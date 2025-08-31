<!-- main application container -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
// import main page component
import HomePage from './components/HomePage.vue';
export default {
  name: 'App',
  components: {
    HomePage
  },
  data() {
    return {
      // current interface theme
      currentTheme: 'green',
    }
  },
  methods: {
    // apply selected theme to document body
    applyTheme(theme) {
      const themes = ['green', 'blue', 'pink', 'purple', 'orange', 'teal'];
      themes.forEach(t => document.body.classList.remove(`theme-${t}`));
      document.body.className = '';
      document.body.classList.add(`theme-${theme}`);
    }
  },
  mounted() {
    // fetch saved theme settings from local server
    fetch('http://localhost:3000/settings')
    .then(res => res.json())
    .then(data => {
      const theme = data.theme || 'light';
      this.currentTheme = theme;
      this.applyTheme(theme);
    })
    .catch(err => {
      console.error('Error loading settings:', err);
      this.applyTheme(this.currentTheme);
    });
  },
  watch: {
    // automatically apply new theme when it changes
    currentTheme(newTheme) {
      this.applyTheme(newTheme);
    }
  }
}
</script>