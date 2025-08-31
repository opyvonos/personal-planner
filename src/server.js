// import required modules
import express from 'express';
import cors from 'cors';
import { addTask, getAllTasks, editTask, deleteTask, addEvent, getAllEvents, editEvent, 
  deleteEvent, addNote, getAllNotes, editNote, deleteNote, addLabel, getAllLabels, deleteLabel, getPriorities, addAuditLog, 
  getAuditLogs, getTaskTitleById, getEventTitleById, getNoteTitleById, getSettings, updateSettings, getSecurityState, updateSecurityState
  } from '../database/operations.js';

// reset authorization status on server startup
async function resetAuthorizationStatus() {
  getSecurityState((err, currentState) => {
    if (err) {
      console.error('Error getting current security state:', err);
      return;
    }
    if (!currentState) {
      console.warn('Current security state not found');
      return;
    }
    const newState = {
      ...currentState,
      is_authorized: 0,
    };
    updateSecurityState(newState, (updateErr) => {
      if (updateErr) {
        console.error('Error resetting authorization status on startup:', updateErr);
      } else {
        console.log('Authorization status reset, other data unchanged');
      }
    });
  });
}
resetAuthorizationStatus();

const app = express();
app.use(cors());
app.use(express.json());

// add new task
app.post('/add-task', (req, res) => {
  const task = req.body;
  addTask(task, (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Failed to add task' });
      } else {
      addAuditLog('create', 1, result.task_id, task.title, (logErr) => {
        if (logErr) {
          console.error('Logging error:', logErr);
        }
        res.send({ message: 'Task added', task_id: result.task_id });
      });
    }
    });
});

// get tasks list
app.get('/tasks', (req, res) => {
  getAllTasks((err, tasks) => {
    if (err) {
      console.error('Error getting tasks:', err);
      res.status(500).send({ error: 'Failed to get tasks' });
    } else {
      res.send(tasks);
    }
  });
});

// update task
app.put('/tasks/:id', (req, res) => {
  const task = req.body;
  task.task_id = req.params.id;
  editTask(task, (err) => {
    if (err) {
      res.status(500).send({ error: 'Failed to update task' });
    } else {
      addAuditLog('update', 1, task.task_id, task.title, (logErr) => {
        if (logErr) console.error('Logging error:', logErr);
        res.send({ message: 'Task updated' });
      });
    }
  });
});

// delete task
app.delete('/tasks/:id', (req, res) => {
  const task_id = req.params.id;
  getTaskTitleById(task_id, (err, taskName) => {
    if (err) {
      console.error('Error finding task:', err);
      return res.status(500).send({ error: 'Error finding task:' });
    }
    deleteTask(task_id, (err) => {
      if (err) {
        res.status(500).send({ error: 'Failed to delete task' });
      } else {
        addAuditLog('delete', 1, task_id, taskName, (logErr) => {
          if (logErr) console.error('Logging error:', logErr);
          res.send({ message: 'Task deleted' });
        });
      }
    });
  });
});

// add new event
app.post('/add-event', (req, res) => {
  const eventData = req.body;
  addEvent(eventData, (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Failed to add event' });
    } else {
      addAuditLog('create', 2, result.event_id, eventData.title, (logErr) => {
        if (logErr) {
          console.error('Logging error:', logErr);
        }
        res.send({ message: 'Event added', event_id: result.event_id });
      });
    }
  });
});

// get events list
app.get('/events', (req, res) => {
  getAllEvents((err, events) => {
    if (err) {
      console.error('Error getting events:', err);
      res.status(500).send({ error: 'Failed to get events' });
    } else {
      res.send(events);
    }
  });
});

// update event
app.put('/events/:id', (req, res) => {
  const event = req.body;
  event.event_id = req.params.id;

  editEvent(event, (err) => {
    if (err) {
      res.status(500).send({ error: 'Failed to update event' });
    } else {
      addAuditLog('update', 2, event.event_id, event.title, (logErr) => {
        if (logErr) console.error('Logging error:', logErr);
        res.send({ message: 'Event updated' });
      });
    }
  });
});

// delete event
app.delete('/events/:id', (req, res) => {
  const event_id = req.params.id;
  getEventTitleById(event_id, (err, eventName) => {
    if (err) {
      console.error('Error finding event:', err);
      return res.status(500).send({ error: 'Error finding event' });
    }
    deleteEvent(event_id, (err) => {
      if (err) {
        res.status(500).send({ error: 'Failed to delete event' });
      } else {
        addAuditLog('delete', 2, event_id, eventName, (logErr) => {
          if (logErr) console.error('Logging error:', logErr);
          res.send({ message: 'Event deleted' });
        });
      }
    });
  });
});

// add note
app.post('/add-note', (req, res) => {
  const noteData = req.body;
  addNote(noteData, (err, result) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to add note' });
    } else {
      addAuditLog('create', 3, result.note_id, noteData.title, (logErr) => {
        if (logErr) {
          console.error('Logging error:', logErr);
        }
        res.send({ message: 'Note added', note_id: result.note_id });
      });
    }
  });
});

// get notes list
app.get('/notes', (req, res) => {
  getAllNotes((err, notes) => {
    if (err) {
      console.error('Error getting notes:', err);
      res.status(500).send({ error: 'Failed to get notes' });
    } else {
      res.send(notes);
    }
  });
});

// update note
app.put('/notes/:id', (req, res) => {
  const note = req.body;
  note.note_id = req.params.id;
  editNote(note, (err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to update note' });
    }
    addAuditLog('update', 3, note.note_id, note.title, (logErr) => {
      if (logErr) console.error('Logging error:', logErr);
      res.send({ message: 'Note updated' });
    });
  });
});

// delete note
app.delete('/notes/:id', (req, res) => {
  const note_id = req.params.id;
  getNoteTitleById(note_id, (err, noteTitle) => {
    if (err) {
      console.error('Error finding note:', err);
      return res.status(500).send({ error: 'Error finding note' });
    }
    deleteNote(note_id, (err) => {
      if (err) {
        res.status(500).send({ error: 'Failed to delete note' });
      } else {
        addAuditLog('delete', 3, note_id, noteTitle, (logErr) => {
          if (logErr) console.error('Logging error:', logErr);
          res.send({ message: 'Note deleted' });
        });
      }
    });
  });
});

// add label
app.post('/add-label', (req, res) => {
  const label = req.body;
  addLabel(label, (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Failed to add label' });
    } else {
      res.send({ message: 'Label added', label_id: result.label_id });
    }
  });
});

// get labels list
app.get('/labels', (req, res) => {
  getAllLabels((err, labels) => {
    if (err) {
      console.error('Error getting labels:', err);
      res.status(500).send({ error: 'Failed to get labels' });
    } else {
      res.send({ labels });
    }
  });
});

// вdelete label
app.delete('/labels/:id', (req, res) => {
  const labelId = req.params.id;
  deleteLabel(labelId, (err) => {
    if (err) {
      console.error('Error deleting label:', err);
      res.status(500).send({ error: 'Failed to delete label' });
    } else {
      res.send({ message: 'Label deleted' });
    }
  });
});

// get priorities
app.get('/priorities', (req, res) => {
  getPriorities((err, priorities) => {
    if (err) {
      console.error('Error getting priorities:', err);
      res.status(500).json({ error: 'Failed to get priorities' });
    } else {
      res.json(priorities);
    }
  });
});

// add audit log entry
app.post('/add-audit-log', (req, res) => {
  const { actionType, itemTypeId, itemId } = req.body;
  addAuditLog(actionType, itemTypeId, itemId, (err, result) => {
    if (err) {
      console.error('Error adding audit log entry:', err);
      res.status(500).send({ error: 'Failed to add audit log entry' });
    } else {
      res.send({ message: 'Log entry added', log_id: result.log_id });
    }
  });
});

// get audit log entries
app.get('/audit-log', (req, res) => {
  getAuditLogs((err, logs) => {
    if (err) {
      console.error('Error getting audit log:', err);
      res.status(500).json({ error: 'Failed to get audit log' });
    } else {
      res.json(logs);
    }
  });
});

// get settings
app.get('/settings', (req, res) => {
  getSettings((err, settings) => {
    if (err) {
      console.error('Error getting settings:', err);
      res.status(500).send({ error: 'Failed to get settings' });
    } else {
      res.send(settings);
    }
  });
});

// update settings
app.put('/settings', (req, res) => {
  const settings = req.body;
  updateSettings(settings, (err) => {
    if (err) {
      res.status(500).send({ error: 'Failed to update settings' });
    } else {
      res.send({ message: 'Settings updated' });
    }
  });
});

// get security state
app.get('/security/state', (req, res) => {
  getSecurityState((err, state) => {
    if (err) {
      console.error('Error getting security state:', err);
      res.status(500).send({ error: 'Failed to get security state' });
    } else {
      res.send(state);
    }
  });
});

// update security state
app.post('/security/update', (req, res) => {
  updateSecurityState(req.body, (err) => {
    if (err) {
      console.error('Error updating security state:', err);
      res.status(500).send({ error: 'Failed to update security state' });
    } else {
      res.send({ success: true });
    }
  });
});

// start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});