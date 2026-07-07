const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'orfeas_secret_key_2026_super_secure';

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer configuration for file uploads (payment receipts or activity images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Μόνο εικόνες (jpg, png) ή αρχεία PDF επιτρέπονται!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication middleware for admin routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Δεν βρέθηκε token, άρνηση πρόσβασης.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Μη έγκυρο ή ληγμένο token.' });
    req.user = user;
    next();
  });
};

// ==========================================
// 1. AUTHENTICATION API
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Παρακαλώ εισάγετε όνομα χρήστη και κωδικό.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Σφάλμα βάσης δεδομένων.' });
    }
    if (!user) {
      return res.status(400).json({ message: 'Το όνομα χρήστη ή ο κωδικός είναι λανθασμένα.' });
    }

    bcrypt.compare(password, user.password_hash, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        return res.status(500).json({ message: 'Σφάλμα κατά την επαλήθευση.' });
      }
      if (!isMatch) {
        return res.status(400).json({ message: 'Το όνομα χρήστη ή ο κωδικός είναι λανθασμένα.' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
      res.json({ token, username: user.username });
    });
  });
});

// Verify token validity
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// ==========================================
// 2. ACTIVITIES API (CRUD)
// ==========================================

// Get all activities (announcements)
app.get('/api/activities', (req, res) => {
  db.all('SELECT * FROM activities ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση των δραστηριοτήτων.' });
    }
    res.json(rows);
  });
});

// Get a single activity
app.get('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM activities WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση της δραστηριότητας.' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Η δραστηριότητα δεν βρέθηκε.' });
    }
    res.json(row);
  });
});

// Create activity (Protected) - supports optional image upload in JSON or multipart later if needed.
// For simplicity, we support standard JSON body.
app.post('/api/activities', authenticateToken, (req, res) => {
  const { title, content, image_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Ο τίτλος και το περιεχόμενο είναι υποχρεωτικά.' });
  }

  db.run('INSERT INTO activities (title, content, image_url) VALUES (?, ?, ?)', 
    [title, content, image_url || null], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Αποτυχία δημιουργίας δραστηριότητας.' });
      }
      res.status(201).json({ id: this.lastID, title, content, image_url, created_at: new Date() });
    }
  );
});

// Update activity (Protected)
app.put('/api/activities/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Ο τίτλος και το περιεχόμενο είναι υποχρεωτικά.' });
  }

  db.run('UPDATE activities SET title = ?, content = ?, image_url = ? WHERE id = ?', 
    [title, content, image_url || null, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Αποτυχία ενημέρωσης δραστηριότητας.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Η δραστηριότητα δεν βρέθηκε.' });
      }
      res.json({ id, title, content, image_url });
    }
  );
});

// Delete activity (Protected)
app.delete('/api/activities/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM activities WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία διαγραφής δραστηριότητας.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Η δραστηριότητα δεν βρέθηκε.' });
    }
    res.json({ message: 'Η δραστηριότητα διαγράφηκε επιτυχώς.' });
  });
});

// API helper for upload images for activities
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Δεν μεταφορτώθηκε αρχείο.' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ==========================================
// 3. MEMBERS REGISTRATION & ADMIN MANAGEMENT API
// ==========================================

// Submit membership registration with payment proof upload
app.post('/api/members', upload.single('payment_proof'), (req, res) => {
  const { fullname, father_name, phone, email, address, gdpr_consent } = req.body;

  if (!fullname || !father_name || !phone || !email || !address) {
    return res.status(400).json({ message: 'Όλα τα πεδία είναι υποχρεωτικά εκτός από το αποδεικτικό κατάθεσης.' });
  }

  if (gdpr_consent !== 'true' && gdpr_consent !== true) {
    return res.status(400).json({ message: 'Πρέπει να αποδεχτείτε τους όρους GDPR για να εγγραφείτε.' });
  }

  let payment_proof_url = null;
  if (req.file) {
    payment_proof_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  db.run(`INSERT INTO members (fullname, father_name, phone, email, address, status, paid_status, payment_proof_url) 
          VALUES (?, ?, ?, ?, ?, 'Pending', 'Unpaid', ?)`, 
    [fullname, father_name, phone, email, address, payment_proof_url], 
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Αποτυχία αποθήκευσης της αίτησης εγγραφής.' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        fullname, 
        message: 'Η αίτηση εγγραφής υποβλήθηκε επιτυχώς και εκκρεμεί έλεγχος από τον διαχειριστή.' 
      });
    }
  );
});

// List all members (Protected)
app.get('/api/members', authenticateToken, (req, res) => {
  // Run cleanup of members whose subscription has expired
  db.run("DELETE FROM members WHERE subscription_expires_at IS NOT NULL AND datetime(subscription_expires_at) < datetime('now', 'localtime')", [], (err) => {
    if (err) console.error("Error cleaning up expired subscriptions:", err.message);
  });

  // Run cleanup of soft-deleted members older than 3 months
  db.run("DELETE FROM members WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', 'localtime', '-3 months')", [], (err) => {
    if (err) console.error("Error cleaning up expired deleted members:", err.message);
  });

  db.all('SELECT * FROM members ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση των μελών.' });
    }
    res.json(rows);
  });
});

// Approve or reject member (Protected)
app.put('/api/members/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Pending, Approved, Rejected

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Μη έγκυρη κατάσταση έγκρισης.' });
  }

  db.run('UPDATE members SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία ενημέρωσης κατάστασης μέλους.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Το μέλος δεν βρέθηκε.' });
    }
    res.json({ id, status });
  });
});

// Update payment status (Protected)
app.put('/api/members/:id/paid', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { paid_status, subscription_expires_at } = req.body; // Paid, Unpaid

  if (!['Paid', 'Unpaid'].includes(paid_status)) {
    return res.status(400).json({ message: 'Μη έγκυρη κατάσταση πληρωμής.' });
  }

  let query;
  let params;
  if (paid_status === 'Paid') {
    if (subscription_expires_at) {
      query = 'UPDATE members SET paid_status = ?, subscription_expires_at = ? WHERE id = ?';
      params = [paid_status, subscription_expires_at, id];
    } else {
      query = "UPDATE members SET paid_status = ?, subscription_expires_at = datetime('now', 'localtime', '+1 year') WHERE id = ?";
      params = [paid_status, id];
    }
  } else {
    query = 'UPDATE members SET paid_status = ?, subscription_expires_at = NULL WHERE id = ?';
    params = [paid_status, id];
  }

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία ενημέρωσης κατάστασης συνδρομής.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Το μέλος δεν βρέθηκε.' });
    }
    
    // Return updated member data so frontend knows the expiration
    db.get('SELECT * FROM members WHERE id = ?', [id], (err, row) => {
      if (err) {
         res.json({ id, paid_status }); // Fallback
      } else {
         res.json(row);
      }
    });
  });
});

// Delete member registration (Protected)
app.delete('/api/members/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("UPDATE members SET deleted_at = datetime('now', 'localtime') WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία διαγραφής μέλους.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Το μέλος δεν βρέθηκε.' });
    }
    res.json({ message: 'Η εγγραφή του μέλους διαγράφηκε επιτυχώς.' });
  });
});

// Update member details (Protected)
app.put('/api/members/:id/details', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { fullname, father_name, phone, email, address } = req.body;

  if (!fullname || !father_name || !phone || !email || !address) {
    return res.status(400).json({ message: 'Όλα τα πεδία είναι υποχρεωτικά.' });
  }

  db.run('UPDATE members SET fullname = ?, father_name = ?, phone = ?, email = ?, address = ? WHERE id = ?', 
    [fullname, father_name, phone, email, address, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Αποτυχία ενημέρωσης στοιχείων μέλους.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Το μέλος δεν βρέθηκε.' });
      }
      res.json({ id, fullname, father_name, phone, email, address });
    }
  );
});

// ==========================================
// 4. SETTINGS API
// ==========================================

// Get all settings
app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Σφάλμα κατά την ανάκτηση των ρυθμίσεων.' });
    }
    const settingsObj = {};
    rows.forEach(row => {
      settingsObj[row.key] = row.value;
    });
    res.json(settingsObj);
  });
});

// Update settings (Protected)
app.put('/api/settings', authenticateToken, (req, res) => {
  const settings = req.body; // Expecting an object of key-value pairs
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Μη έγκυρα δεδομένα ρυθμίσεων.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let hasError = false;
    for (const [key, value] of Object.entries(settings)) {
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
        if (err) {
          hasError = true;
          console.error(`Error updating setting ${key}:`, err.message);
        }
      });
    }

    db.run('COMMIT', (err) => {
      if (err || hasError) {
        return res.status(500).json({ message: 'Αποτυχία ενημέρωσης ρυθμίσεων.' });
      }
      res.json({ message: 'Οι ρυθμίσεις ενημερώθηκαν επιτυχώς.' });
    });
  });
});

// ==========================================
// 5. SLIDESHOW IMAGES API
// ==========================================

// Get all slideshow images
app.get('/api/settings/slideshow', (req, res) => {
  const slideshowDir = path.join(__dirname, 'uploads', 'slideshow');
  if (!fs.existsSync(slideshowDir)) {
    fs.mkdirSync(slideshowDir, { recursive: true });
  }

  fs.readdir(slideshowDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία ανάγνωσης φακέλου slideshow' });
    }
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files
      .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => `${req.protocol}://${req.get('host')}/uploads/slideshow/${file}`);
    res.json(images);
  });
});

// Upload image to slideshow (Protected)
app.post('/api/settings/slideshow', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Δεν μεταφορτώθηκε αρχείο.' });
  }

  const slideshowDir = path.join(__dirname, 'uploads', 'slideshow');
  if (!fs.existsSync(slideshowDir)) {
    fs.mkdirSync(slideshowDir, { recursive: true });
  }

  const oldPath = req.file.path;
  const newPath = path.join(slideshowDir, req.file.filename);

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      // Clean up uploaded file if rename fails
      fs.unlink(oldPath, () => {});
      return res.status(500).json({ message: 'Αποτυχία μετακίνησης αρχείου στο slideshow.' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/slideshow/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  });
});

// Delete image from slideshow (Protected)
app.delete('/api/settings/slideshow/:filename', authenticateToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', 'slideshow', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Η εικόνα δεν βρέθηκε.' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Αποτυχία διαγραφής αρχείου.' });
    }
    res.json({ message: 'Η εικόνα διαγράφηκε επιτυχώς.' });
  });
});

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback all other GET requests to index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Please run npm run build.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
