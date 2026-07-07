const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run("DELETE FROM members", [], function(err) {
    if (err) {
      console.error('Error deleting members:', err.message);
    } else {
      console.log(`Successfully deleted ${this.changes} members/subscriptions from the database.`);
    }
  });
});

db.close();
