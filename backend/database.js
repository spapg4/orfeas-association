const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');

// Ensure parent directory exists for SQLite database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize database schema
db.serialize(() => {
  // 1. Create Users Table (for Admin Login)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });

  // 2. Create Activities Table (Announcements, Events, News)
  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating activities table:', err.message);
  });

  // 3. Create Members Table (Registrations, Status, Fees)
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    father_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    paid_status TEXT DEFAULT 'Unpaid', -- Unpaid, Paid
    payment_proof_url TEXT,
    subscription_expires_at DATETIME,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating members table:', err.message);
  });

  // Alter members table to add deleted_at if it's missing
  db.run(`ALTER TABLE members ADD COLUMN deleted_at DATETIME`, (err) => {
    // Ignore error if column already exists
  });

  // 4. Create Settings Table (for Dynamic Page content)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating settings table:', err.message);
    } else {
      // Seed default settings if empty
      seedDefaultSettings();
    }
  });

  // 5. Create Calendar Events Table (for Live Calendar)
  db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    event_time TEXT NOT NULL, -- Format: HH:MM
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating calendar_events table:', err.message);
  });

  // 6. Create Articles Table (for Visitor Articles with Admin Approval)
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating articles table:', err.message);
  });

  // Seed default admin user
  const defaultAdmin = 'admin';
  const defaultPass = 'adminorfeas123';

  db.get('SELECT * FROM users WHERE username = ?', [defaultAdmin], (err, row) => {
    if (err) {
      console.error('Error querying users:', err.message);
      return;
    }
    if (!row) {
      bcrypt.hash(defaultPass, 10, (hashErr, hash) => {
        if (hashErr) {
          console.error('Error hashing password:', hashErr.message);
          return;
        }
        db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [defaultAdmin, hash], (insertErr) => {
          if (insertErr) {
            console.error('Error seeding admin user:', insertErr.message);
          } else {
            console.log('Default admin user successfully seeded.');
          }
        });
      });
    }
  });
});

// Function to seed initial settings values
function seedDefaultSettings() {
  const defaults = {
    hero_title: 'Μορφωτικός & Εξωραϊστικός Σύλλογος "Ο ΟΡΦΕΑΣ"',
    hero_subtitle: 'Μεγάλου Ελευθεροχωρίου Ελασσόνας. Διατηρώντας τις παραδόσεις, καλλιεργώντας τον πολιτισμό και ομορφαίνοντας τον τόπο μας για τις επόμενες γενιές.',
    hero_image_url: '/hero-banner.jpg',
    about_text_1: 'Ο Μορφωτικός και Εξωραϊστικός Σύλλογος «Ορφέας» Μεγάλου Ελευθεροχωρίου Ελασσόνας ιδρύθηκε με σκοπό να αποτελέσει τον συνδετικό κρίκο των απανταχού Ελευθεροχωριτών και να κρατήσει ζωντανή την πολιτιστική ταυτότητα του τόπου μας. Το Μεγάλο Ελευθεροχώρι, χτισμένο στις πλαγιές των Αντιχασίων, κουβαλάει μια μακρά ιστορική διαδρομή γεμάτη αγώνες, παραδόσεις και αυθεντική θεσσαλική φιλοξενία.',
    about_text_2: 'Μέσα από τις ποικίλες δραστηριότητές μας – τη λειτουργία παραδοσιακών χορευτικών τμημάτων, τη διοργάνωση των ετήσιων πολιτιστικών εκδηλώσεων («Ορφεία»), τις εθελοντικές δράσεις καθαρισμού και δενδροφύτευσης, καθώς και τις ενημερωτικές ημερίδες – ο Σύλλογος επιδιώκει να αναβαθμίσει την ποιότητα ζωής στο χωριό και να προσφέρει δημιουργικά ερεθίσματα στους νέους μας.',
    stat_year: '1982',
    stat_members: '500+',
    stat_actions: '20+',
    payment_bank: 'Εθνική Τράπεζα της Ελλάδος',
    payment_beneficiary: 'Μορφωτικός Σύλλογος "Ο Ορφέας"',
    payment_iban: 'GR12 0110 2340 0000 2345 6789 012',
    payment_fee: '5',
    footer_about_text: 'Μορφωτικός & Εξωραϊστικός Σύλλογος Μεγάλου Ελευθεροχωρίου Ελασσόνας. Ιδρύθηκε το 1982 με σκοπό την προώθηση του πολιτισμού και τον εξωραϊσμό του τόπου μας.',
    footer_address: 'Μεγάλο Ελευθεροχώρι Ελασσόνας, Τ.Κ. 40200',
    footer_email: 'orfeas.meg.elefth@gmail.com',
    footer_phone: '+30 24930 XXXXX'
  };

  db.serialize(() => {
    Object.entries(defaults).forEach(([key, value]) => {
      db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
        if (err) console.error(`Error seeding setting ${key}:`, err.message);
      });
    });
  });
}

module.exports = db;
