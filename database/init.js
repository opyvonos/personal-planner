// import SQLite
import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
// connect to DB
const db = new sqlite3.Database('./database/db.sqlite3', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    // tasks table
    db.run("CREATE TABLE IF NOT EXISTS tasks (" +
        "task_id INTEGER PRIMARY KEY, " +
        "title TEXT NOT NULL, " +
        "description TEXT, " +
        "due_date DATETIME, " +
        "priority_level_id INTEGER, " +
        "status_id INTEGER NOT NULL, " +
        "created_at DATETIME NOT NULL, " +
        "updated_at DATETIME NOT NULL, " +
        "FOREIGN KEY (priority_level_id) REFERENCES priority(priority_level_id), " +
        "FOREIGN KEY (status_id) REFERENCES status(status_id))");
    // events table
    db.run("CREATE TABLE IF NOT EXISTS events (" +
        "event_id INTEGER PRIMARY KEY, " +
        "title TEXT NOT NULL, " +
        "description TEXT, " +
        "start_time DATETIME, " +
        "end_time DATETIME, " +
        "priority_level_id INTEGER, " +
        "created_at DATETIME NOT NULL, " +
        "updated_at DATETIME NOT NULL, " +
        "FOREIGN KEY (priority_level_id) REFERENCES priority(priority_level_id))");
    // notes table  
    db.run("CREATE TABLE IF NOT EXISTS notes (" +
        "note_id INTEGER PRIMARY KEY, " +
        "title TEXT, " +
        "content TEXT, " +
        "color TEXT, " +
        "label_id INTEGER, " +
        "created_at DATETIME NOT NULL, " +
        "updated_at DATETIME NOT NULL, " +
        "FOREIGN KEY (label_id) REFERENCES labels(label_id))");
    // labels table
    db.run("CREATE TABLE IF NOT EXISTS labels (" +
        "label_id INTEGER PRIMARY KEY, " +
        "name TEXT NOT NULL, " +
        "color TEXT NOT NULL, " +
        "created_at DATETIME NOT NULL)");
    // audit log table
    db.run("CREATE TABLE IF NOT EXISTS audit_log (" +
        "log_id INTEGER PRIMARY KEY, " +
        "action_type TEXT NOT NULL, " +
        "item_type_id INTEGER NOT NULL, " +
        "item_id INTEGER NOT NULL, " +
        "item_name TEXT, " +
        "time DATETIME NOT NULL, " +
        "FOREIGN KEY (item_type_id) REFERENCES item_types(item_type_id))");
    // user settings table
    db.run("CREATE TABLE IF NOT EXISTS user_settings (" +
        "setting_id INTEGER PRIMARY KEY, " +
        "theme TEXT NOT NULL, " +
        "pin_hash TEXT)");
    // priority table
    db.run("CREATE TABLE IF NOT EXISTS priority (" +
        "priority_level_id INTEGER PRIMARY KEY, " +
        "name TEXT NOT NULL, " +
        "color TEXT NOT NULL)");
    // status table  
    db.run("CREATE TABLE IF NOT EXISTS status (" +
        "status_id INTEGER PRIMARY KEY, " +
        "name TEXT NOT NULL)");
    // item types table  
    db.run("CREATE TABLE IF NOT EXISTS item_types (" +
        "item_type_id INTEGER PRIMARY KEY, " +
        "name TEXT NOT NULL)");
    // security state table
    db.run("CREATE TABLE IF NOT EXISTS security_state (" +
        "id INTEGER PRIMARY KEY CHECK (id = 1), " +
        "is_authorized INTEGER NOT NULL, " +
        "failed_attempts INTEGER NOT NULL, " +
        "lock_until INTEGER)");
    // insert initial data into status table
    db.run(`INSERT OR IGNORE INTO status (status_id, name) VALUES (1, 'complete'), (2, 'incomplete')`);
    // insert initial data into item types table
    db.run(`INSERT OR IGNORE INTO item_types (item_type_id, name) VALUES (1, 'task'), (2, 'note'), (3, 'event')`);
    // insert initial data into priority table
    db.run(`INSERT OR IGNORE INTO priority (priority_level_id, name, color) VALUES
        (1, 'Низький', '#2196f3'),
        (2, 'Середній', '#00ff00'),
        (3, 'Високий', '#ff8000'),
        (4, 'Критичний', '#fa0000')`);
    // insert initial data into user settings table
    db.run(`INSERT OR IGNORE INTO user_settings (setting_id, theme, pin_hash) VALUES (1, 'green', NULL)`);
    // insert initial data into security state table
    db.run("INSERT OR IGNORE INTO security_state (id, is_authorized, failed_attempts, lock_until) VALUES (1, 0, 0, NULL)");
});

export { db };