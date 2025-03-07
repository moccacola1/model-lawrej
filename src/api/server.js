const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const modelManager = require('../models/ModelManager');
const config = require('../config/config');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const docsRouter = require('./docs');

// Inisialisasi express
const app = express();

// Middleware
app.use(helmet()); // Keamanan
app.use(cors()); // CORS
app.use(express.json()); // Parsing JSON

// Middleware untuk logging request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Middleware untuk rate limiting sederhana
const rateLimiter = (options) => {
  const requests = new Map();
  const { windowMs, max } = options;
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Bersihkan permintaan lama
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip)
      .filter(time => now - time < windowMs);
    
    if (userRequests.length >= max) {
      return res.status(429).json({
        status: 'error',
        message: 'Terlalu banyak permintaan, coba lagi nanti'
      });
    }
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    next();
  };
};

// Middleware untuk autentikasi dengan JWT
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Tidak ada token otentikasi'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Autentikasi gagal: ${error.message}`);
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid'
    });
  }
};

// Route untuk memeriksa status server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Sistem AI berfungsi',
    timestamp: new Date().toISOString()
  });
});

// Route untuk login dan mendapatkan token
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // CATATAN: Ini hanya contoh, harusnya menggunakan autentikasi yang lebih aman
    if (username === 'admin' && password === 'password') {
      const token = jwt.sign(
        { username, role: 'admin' },
        config.security.jwtSecret,
        { expiresIn: config.security.jwtExpiresIn }
      );
      
      return res.json({
        status: 'success',
        token,
        expiresIn: config.security.jwtExpiresIn
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Kombinasi username dan password tidak valid'
    });
  } catch (error) {
    logger.error(`Login gagal: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server'
    });
  }
});

// Route untuk mendapatkan informasi model
app.get('/api/models', authenticate, async (req, res) => {
  try {
    if (!modelManager.initialized) {
      await modelManager.init();
    }
    
    const modelInfo = modelManager.getModelInfo();
    
    res.json({
      status: 'success',
      data: modelInfo
    });
  } catch (error) {
    logger.error(`Gagal mendapatkan informasi model: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route untuk menghasilkan teks dengan model tertentu
app.post('/api/generate/:model', authenticate, rateLimiter(config.security.rateLimiting), async (req, res) => {
  try {
    const { model } = req.params;
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt diperlukan'
      });
    }
    
    if (!modelManager.initialized) {
      await modelManager.init();
    }
    
    let result;
    
    if (model.toLowerCase() === 'all') {
      // Hasilkan teks dari semua model
      result = await modelManager.generateFromAllModels(prompt, options);
    } else {
      // Hasilkan teks dari model tertentu
      const modelInstance = modelManager.getModel(model);
      const generatedText = await modelInstance.generate(prompt, options);
      
      result = {
        model,
        prompt,
        generated_text: generatedText,
        timestamp: new Date().toISOString()
      };
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Gagal menghasilkan teks: ${error.message}`);
    res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route untuk memuat model
app.post('/api/models/:model/load', authenticate, async (req, res) => {
  try {
    const { model } = req.params;
    
    if (!modelManager.initialized) {
      await modelManager.init();
    }
    
    let result;
    
    if (model.toLowerCase() === 'all') {
      // Muat semua model
      result = await modelManager.loadAllModels();
    } else {
      // Muat model tertentu
      const modelInstance = modelManager.getModel(model);
      await modelInstance.load();
      
      result = {
        model,
        status: 'success',
        message: `Model ${model} berhasil dimuat`,
        timestamp: new Date().toISOString()
      };
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Gagal memuat model: ${error.message}`);
    res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route untuk membebaskan model
app.post('/api/models/:model/unload', authenticate, async (req, res) => {
  try {
    const { model } = req.params;
    
    if (!modelManager.initialized) {
      await modelManager.init();
    }
    
    let result;
    
    if (model.toLowerCase() === 'all') {
      // Bebaskan semua model
      result = await modelManager.unloadAllModels();
    } else {
      // Bebaskan model tertentu
      const modelInstance = modelManager.getModel(model);
      await modelInstance.unload();
      
      result = {
        model,
        status: 'success',
        message: `Model ${model} berhasil dibebaskan`,
        timestamp: new Date().toISOString()
      };
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Gagal membebaskan model: ${error.message}`);
    res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Gunakan router dokumentasi
app.use('/api/docs', docsRouter);

// Middleware untuk menangani rute yang tidak ada
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint tidak ditemukan'
  });
});

// Middleware untuk menangani error
app.use((err, req, res, next) => {
  logger.error(`Error server: ${err.message}`);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan server'
  });
});

// Mulai server
const startServer = async () => {
  try {
    // Inisialisasi model manager
    await modelManager.init();
    logger.info('Model Manager berhasil diinisialisasi');
    
    // Pastikan direktori log ada
    const logDir = path.dirname(config.logger.file);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Mulai server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info(`Server berjalan di port ${PORT} pada mode ${config.server.env}`);
      logger.info(`Dokumentasi API tersedia di http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error(`Gagal memulai server: ${error.message}`);
    process.exit(1);
  }
};

// Jika dijalankan langsung
if (require.main === module) {
  startServer();
}

module.exports = app; 