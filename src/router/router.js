// import required dependencies
import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import TaskManager from '../components/TaskManager.vue'
import Events from '../components/Events.vue'
import Notes from '../components/Notes.vue'
import Activity from '../components/ActivityHistory.vue'

// define routes
const routes = [
  { path: '/', component: HomePage },
  { path: '/tasks', component: TaskManager },
  { path: '/events', component: Events },
  { path: '/notes', component: Notes },
  { path: '/audit-log', component: Activity }
]

// create router instance
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router