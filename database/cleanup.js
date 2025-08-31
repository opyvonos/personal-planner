// import SQLite
import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
// connect to DB
const db = new sqlite3.Database('../database/db.sqlite3', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
        console.log('Database cleared');
    }
});

// drop tables
db.serialize(() => {
    db.run("DROP TABLE IF EXISTS tasks");
    db.run("DROP TABLE IF EXISTS events");
    db.run("DROP TABLE IF EXISTS notes");
    db.run("DROP TABLE IF EXISTS labels");
    db.run("DROP TABLE IF EXISTS user_settings");
    db.run("DROP TABLE IF EXISTS audit_log");
    db.run("DROP TABLE IF EXISTS priority");
    db.run("DROP TABLE IF EXISTS status");
    db.run("DROP TABLE IF EXISTS item_types");
    db.run("DROP TABLE IF EXISTS security_state");
});