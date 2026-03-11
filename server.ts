import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Database
const db = new Database('aravalli.db');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ndvi_score REAL,
    degradation_status TEXT, -- 'Natural', 'Seasonal', 'Permanent Degradation'
    construction_detected BOOLEAN,
    nightlight_intensity REAL,
    is_legal_construction BOOLEAN,
    user_verified BOOLEAN DEFAULT NULL, -- NULL = pending, 1 = confirmed, 0 = rejected
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    dob TEXT,
    contact TEXT,
    email TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS prompt_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Add new columns to users table if they don't exist
try { db.prepare("ALTER TABLE users ADD COLUMN name TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN dob TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN contact TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run(); } catch (e) {}

// Create a 'user' for general testing if it doesn't exist
try {
  const testUser = db.prepare("SELECT id FROM users WHERE username = 'user'").get() as any;
  if (!testUser) {
    db.prepare("INSERT INTO users (username, password, role) VALUES ('user', 'user', 'user')").run();
  }
} catch (e) { console.error("Error creating test user:", e); }

// Initialize default settings if empty
const defaultSettings = {
  theme: {
    primary: '#10b981', // emerald-500
    background: '#fafafa', // zinc-50
    text: '#18181b', // zinc-900
    radius: '0.75rem', // rounded-xl
  },
  features: {
    showChatbot: true,
    showSuggestions: true,
    showHistory: true,
    showMap: true
  },
  content: {
    appName: 'Aravalli Watch',
    welcomeMessage: 'Eco-Monitoring System'
  }
};

const existingSettings = db.prepare('SELECT value FROM settings WHERE key = ?').get('global_config');
if (!existingSettings) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('global_config', JSON.stringify(defaultSettings));
}

// Update admin credentials
const adminUsername = 'nxtboi';
const adminPassword = 'Vijay@147896';

// 1. Remove old 'admin' user if it exists (cleanup)
try {
  const oldAdmin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any;
  if (oldAdmin) {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(oldAdmin.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(oldAdmin.id);
  }
} catch (e) { console.error("Error cleaning up old admin:", e); }

// 2. Create or update the new admin user
try {
  const newAdmin = db.prepare("SELECT id FROM users WHERE username = ?").get(adminUsername) as any;
  if (newAdmin) {
    db.prepare("UPDATE users SET password = ?, role = 'admin' WHERE id = ?").run(adminPassword, newAdmin.id);
  } else {
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')").run(adminUsername, adminPassword);
  }
} catch (e) { console.error("Error setting up new admin:", e); }

const getAllSourceFiles = (dirPath: string, baseDir: string, arrayOfFiles: string[] = []) => {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      // Exclude node_modules or other non-source directories if they exist inside src
      if (item !== 'node_modules') {
        getAllSourceFiles(fullPath, baseDir, arrayOfFiles);
      }
    } else {
      const allowedExtensions = ['.tsx', '.ts', '.css'];
      if (allowedExtensions.some(ext => item.endsWith(ext))) {
        const relativePath = fullPath.substring(baseDir.length + 1).replace(/\\/g, '/');
        arrayOfFiles.push(relativePath);
      }
    }
  });

  return arrayOfFiles;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Settings Routes
  app.get('/api/settings', (req, res) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('global_config') as any;
    res.json(row ? JSON.parse(row.value) : defaultSettings);
  });

  app.post('/api/admin/settings', (req, res) => {
    const { config } = req.body;
    if (!config) return res.status(400).json({ error: 'Config required' });
    
    try {
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(JSON.stringify(config), 'global_config');
      res.json({ success: true });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

app.post('/api/admin/prompt-history', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    try {
      db.prepare('INSERT INTO prompt_history (prompt) VALUES (?)').run(prompt);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save prompt' });
    }
  });

  app.get('/api/admin/prompt-history', (req, res) => {
    try {
      const prompts = db.prepare('SELECT * FROM prompt_history ORDER BY timestamp DESC LIMIT 10').all();
      res.json({ prompts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch prompt history' });
    }
  });

  // --- Source Code Editing Endpoints ---

  app.get('/api/admin/stats', (req, res) => {
  try {
    const usersStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const totalUsers = usersStmt.get().count;

    // In a real app, you'd get this from package.json or a config file
    const siteVersion = '1.2.1'; 

    // Placeholder for AI requests - this would need a proper logging/tracking mechanism
    const aiRequests = 42;

    res.json({ 
      stats: {
        totalUsers,
        siteVersion,
        aiRequests
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/files', (req, res) => {
    try {
      const srcDir = join(__dirname, 'src');
      const allFiles = getAllSourceFiles(srcDir, __dirname);
      res.json({ files: allFiles.sort() });
    } catch (error) {
      console.error("List files error:", error);
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  app.post('/api/admin/read-file', (req, res) => {
    const { path } = req.body;
    // Basic security check
    if (!path || !path.startsWith('src/') || path.includes('..')) {
      return res.status(400).json({ error: "Invalid path" });
    }

    try {
      const fullPath = join(__dirname, path);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: "File not found" });
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.json({ content });
    } catch (error) {
      console.error("Read file error:", error);
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  app.post('/api/admin/write-file', (req, res) => {
    const { path, content } = req.body;
    // Basic security check
    if (!path || !path.startsWith('src/') || path.includes('..')) {
      return res.status(400).json({ error: "Invalid path" });
    }

    try {
      const fullPath = join(__dirname, path);
      fs.writeFileSync(fullPath, content, 'utf-8');
      res.json({ success: true });
    } catch (error) {
      console.error("Write file error:", error);
      res.status(500).json({ error: "Failed to write file" });
    }
  });

  // Auth Routes
  app.post('/api/register', (req, res) => {
    const { username, password, name, dob, contact, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    try {
      const result = db.prepare(
        'INSERT INTO users (username, password, name, dob, contact, email) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, password, name || null, dob || null, contact || null, email || null);
      res.json({ success: true, userId: result.lastInsertRowid.toString() });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
    
    if (user) {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
      res.json({ success: true, token, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    const { token } = req.body;
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    res.json({ success: true });
  });

  app.get('/api/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    
    const token = authHeader.split(' ')[1];
    const session = db.prepare(`
      SELECT users.username, users.id, users.role 
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.token = ?
    `).get(token) as any;

    if (session) {
      res.json({ user: session });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Get recent analyses
  app.get('/api/history', (req, res) => {
    const rows = db.prepare('SELECT * FROM analyses ORDER BY timestamp DESC LIMIT 50').all();
    res.json(rows);
  });

  // Submit new analysis (Simulated for now, would connect to Gemini/Satellite API)
  app.post('/api/analyze', (req, res) => {
    const { location, image } = req.body;
    
    // SIMULATION LOGIC for Demo Purposes
    // In a real app, this would process the image pixels and query satellite APIs
    
    const ndvi = Math.random() * 0.8 - 0.2; // Random NDVI between -0.2 and 0.6
    const nightlight = Math.random() * 100;
    
    let status = 'Natural';
    if (ndvi < 0.2) {
       if (nightlight > 50) {
         status = 'Permanent Degradation'; // Mining/Construction
       } else {
         status = 'Seasonal'; // Just dry season
       }
    }

    const isConstruction = nightlight > 60;
    const isLegal = Math.random() > 0.7; // 30% chance of illegal if construction exists

    // Enhanced ML Data Simulation
    const mlConfidence = 0.85 + Math.random() * 0.14; // 0.85 - 0.99
    const detectedObjects = [
      { label: 'Trees', count: Math.floor(Math.random() * 50) + 10 },
      { label: 'Structures', count: isConstruction ? Math.floor(Math.random() * 5) + 1 : 0 },
      { label: 'Water Bodies', count: Math.floor(Math.random() * 2) }
    ];
    const indices = {
      evi: ndvi * 0.8 + 0.1, // Enhanced Vegetation Index
      savi: ndvi * 0.9 + 0.05 // Soil Adjusted Vegetation Index
    };
    const prediction = status === 'Natural' 
      ? 'Stable ecosystem expected for next 12 months.' 
      : 'High risk of desertification in 6 months if unchecked.';

    const result = db.prepare(`
      INSERT INTO analyses (location_name, ndvi_score, degradation_status, construction_detected, nightlight_intensity, is_legal_construction, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(location || 'Unknown Location', ndvi, status, isConstruction ? 1 : 0, nightlight, isLegal ? 1 : 0, image || '');

    res.json({
      id: result.lastInsertRowid.toString(),
      ndvi,
      status,
      nightlight,
      isConstruction,
      isLegal,
      // New ML fields
      mlConfidence,
      detectedObjects,
      indices,
      prediction
    });
  });

  // Verify analysis
  app.post('/api/verify/:id', (req, res) => {
    const { id } = req.params;
    const { correct } = req.body; // true or false
    
    db.prepare('UPDATE analyses SET user_verified = ? WHERE id = ?').run(correct ? 1 : 0, id);
    res.json({ success: true });
  });

  // Get specific location details (Simulated)
  app.get('/api/location/:id', (req, res) => {
    const { id } = req.params;
    
    // Deterministic mock data based on ID to match map visuals
    // loc_1: Degradation (Red)
    // loc_2: Construction (Orange)
    // loc_3: Natural (Green)
    
    let soil_moisture = 85;
    let canopy_cover = 90;
    let alerts: string[] = [];
    let history = [
      { year: 2021, status: 'Healthy' },
      { year: 2022, status: 'Healthy' },
      { year: 2023, status: 'Healthy' }
    ];

    if (id === 'loc_1') { // Degradation
      soil_moisture = 32;
      canopy_cover = 28;
      alerts = ['Rapid vegetation loss detected', 'Soil erosion risk: High'];
      history = [
        { year: 2021, status: 'Healthy' },
        { year: 2022, status: 'Minor Degradation' },
        { year: 2023, status: 'Critical' }
      ];
    } else if (id === 'loc_2') { // Construction
      soil_moisture = 45;
      canopy_cover = 15;
      alerts = ['Unauthorized structure detected', 'High nightlight intensity'];
      history = [
        { year: 2021, status: 'Healthy' },
        { year: 2022, status: 'Stable' },
        { year: 2023, status: 'Construction' }
      ];
    }

    const details = {
      id,
      last_analyzed: new Date().toISOString(),
      historical_changes: history,
      soil_moisture,
      canopy_cover,
      alerts
    };
    
    // Simulate network delay
    setTimeout(() => {
      res.json(details);
    }, 500);
  });

  // --- ALL API ROUTES MUST BE ABOVE THIS LINE ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
