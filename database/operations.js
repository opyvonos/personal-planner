import { db } from './init.js';

// tasks
export function addTask(task, callback) {
    const {
        title,
        description = null,
        due_date = null,
        priority_level_id = null,
        status_id = 2,
    } = task;

    const created_at = new Date().toISOString();
    const updated_at = created_at;
    
    db.run(`INSERT INTO tasks (title, description, due_date, priority_level_id, status_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, due_date, priority_level_id, status_id, created_at, updated_at],
        function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, { task_id: this.lastID });
            }
        }
    );
}

export function getAllTasks(callback) {
  db.all(`SELECT t.*, s.name AS status_name, p.name AS priority_name, p.color AS priority_color
          FROM tasks t
          LEFT JOIN status s ON t.status_id = s.status_id
          LEFT JOIN priority p ON t.priority_level_id = p.priority_level_id
          ORDER BY t.created_at DESC`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

export function editTask(task, callback) {
  const {
    task_id,
    title,
    description = null,
    due_date = null,
    priority_level_id = null,
    status_id,
  } = task;

  const updated_at = new Date().toISOString();

  db.run(
    `UPDATE tasks SET
      title = ?,
      description = ?,
      due_date = ?,
      priority_level_id = ?,
      status_id = ?,
      updated_at = ?
    WHERE task_id = ?`,
    [
      title,
      description,
      due_date,
      priority_level_id,
      status_id,
      updated_at,
      task_id
    ],
    function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

export function deleteTask(task_id, callback) {
  db.run(
    `DELETE FROM tasks WHERE task_id = ?`,
    [task_id],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

// events
export function addEvent(event, callback) {
    const {
        title,
        description = null,
        start_time = null,
        end_time = null,
        priority_level_id = null,
    } = event;

    const created_at = new Date().toISOString();
    const updated_at = created_at;

    db.run(
        `INSERT INTO events (
            title, description, start_time, end_time,
            priority_level_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            title,
            description,
            start_time || null,
            end_time || null,
            priority_level_id,
            created_at,
            updated_at
        ],
        function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, { event_id: this.lastID });
            }
        }
    );
}

export function getAllEvents(callback) {
  db.all(`SELECT * FROM events`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

export function editEvent(event, callback) {
    const {
        event_id,
        title,
        description = null,
        start_time = null,
        end_time = null,
        priority_level_id = null,
    } = event;

    const updated_at = new Date().toISOString();

    db.run(
        `UPDATE events SET
            title = ?,
            description = ?,
            start_time = ?,
            end_time = ?,
            priority_level_id = ?,
            updated_at = ?
        WHERE event_id = ?`,
        [
            title,
            description,
            start_time || null,
            end_time || null,
            priority_level_id,
            updated_at,
            event_id
        ],
        function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

export function deleteEvent(event_id, callback) {
  db.run(
    `DELETE FROM events WHERE event_id = ?`,
    [event_id],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

// notes
export function addNote(note, callback) {
  const {
    title,
    content = null,
    color = null,
    label_id = null,
  } = note;

  const created_at = new Date().toISOString();
  const updated_at = created_at;

  db.run(
    `INSERT INTO notes (title, content, color, label_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, content, color, label_id, created_at, updated_at],
    function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { note_id: this.lastID });
      }
    }
  );
}

export function getAllNotes(callback) {
  db.all(`SELECT * FROM notes`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

export function editNote(note, callback) {
  const {
    note_id,
    title,
    content = null,
    color = null,
    label_id = null,
  } = note;

  const updated_at = new Date().toISOString();

  db.run(
    `UPDATE notes SET
      title = ?,
      content = ?,
      color = ?,
      label_id = ?,
      updated_at = ?
    WHERE note_id = ?`,
    [
      title,
      content,
      color,
      label_id,
      updated_at,
      note_id
    ],
    function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

export function deleteNote(note_id, callback) {
  db.run(
    `DELETE FROM notes WHERE note_id = ?`,
    [note_id],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

// labels
export function addLabel(label, callback) {
  const {
    name,
    color
  } = label;

  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO labels (name, color, created_at) VALUES (?, ?, ?)`,
    [name, color, created_at],
    function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { label_id: this.lastID });
      }
    }
  );
}

export function getAllLabels(callback) {
  db.all(`SELECT * FROM labels`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

export function deleteLabel(label_id, callback) {
  db.run(
    `DELETE FROM labels WHERE label_id = ?`,
    [label_id],
    function (err) {
      if (err) {
        callback(err);
      } else {
        db.run(
          `UPDATE notes SET label_id = NULL WHERE label_id = ?`,
          [label_id],
          function (updateErr) {
            if (updateErr) {
              callback(updateErr);
            } else {
              callback(null);
            }
          }
        );
      }
    }
  );
}

// priorities
export function getPriorities(callback) {
  db.all(`SELECT * FROM priority`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

// audit log
export function addAuditLog(actionType, itemTypeId, itemId, itemName, callback) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO audit_log (action_type, item_type_id, item_id, item_name, time) VALUES (?, ?, ?, ?, ?)`);
  
  stmt.run(actionType, itemTypeId, itemId, itemName, now, function(err) {
    stmt.finalize();
    if (err) {
      callback(err);
    } else {
      callback(null, { log_id: this.lastID });
    }
  });
}

export function getAuditLogs(callback) {
  db.all(`SELECT * FROM audit_log`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

// get items by ID
export function getTaskTitleById(task_id, callback) {
  db.get(`SELECT title FROM tasks WHERE task_id = ?`, [task_id], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, row?.title || 'без назви');
    }
  });
}

export function getEventTitleById(event_id, callback) {
  db.get(`SELECT title FROM events WHERE event_id = ?`, [event_id], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, row?.title || 'без назви');
    }
  });
}

export function getNoteTitleById(note_id, callback) {
  db.get(`SELECT title FROM notes WHERE note_id = ?`, [note_id], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, row?.title || 'без назви');
    }
  });
}

// settings
export function getSettings(callback) {
  db.get(
    `SELECT theme, pin_hash FROM user_settings WHERE setting_id = 1`,
    (err, row) => {
      if (err) {
        callback(err);
      } else {
        callback(null, row);
      }
    }
  );
}

export function updateSettings(settings, callback) {
  const { theme, pin_hash } = settings;

  db.run(
    `UPDATE user_settings
     SET theme = ?, pin_hash = ?
     WHERE setting_id = 1`,
    [theme, pin_hash],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

// user security
export function getSecurityState(callback) {
  db.get("SELECT * FROM security_state WHERE id = 1", (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

export function updateSecurityState(state, callback) {
  const { is_authorized, failed_attempts, lock_until } = state;

  db.run(
    `UPDATE security_state
     SET is_authorized = ?, failed_attempts = ?, lock_until = ?
     WHERE id = 1`,
    [is_authorized, failed_attempts, lock_until],
    function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}