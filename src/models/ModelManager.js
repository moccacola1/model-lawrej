const LlamaModel = require('./LlamaModel');
const MistralModel = require('./MistralModel');
const GptjModel = require('./GptjModel');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Kelas ModelManager bertanggung jawab untuk mengelola semua model AI
 * dan menyediakan interface tunggal untuk mengakses mereka
 */
class ModelManager {
  constructor() {
    this.models = {};
    this.initialized = false;
  }

  /**
   * Inisialisasi semua model yang tersedia
   * @returns {Promise<boolean>} Status keberhasilan inisialisasi
   */
  async init() {
    try {
      logger.info('Menginisialisasi ModelManager');
      
      // Inisialisasi model LLaMA
      this.models.llama = new LlamaModel(config.models.llama);
      
      // Inisialisasi model Mistral
      this.models.mistral = new MistralModel(config.models.mistral);
      
      // Inisialisasi model GPT-J
      this.models.gptj = new GptjModel(config.models.gptj);
      
      this.initialized = true;
      logger.info('ModelManager berhasil diinisialisasi');
      return true;
    } catch (error) {
      logger.error(`Gagal menginisialisasi ModelManager: ${error.message}`);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Mendapatkan model berdasarkan nama
   * @param {string} modelName Nama model ('llama', 'mistral', 'gptj')
   * @returns {BaseModel} Instance model
   */
  getModel(modelName) {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    const model = this.models[modelName.toLowerCase()];
    if (!model) {
      throw new Error(`Model '${modelName}' tidak ditemukan`);
    }
    
    return model;
  }

  /**
   * Mendapatkan semua model yang tersedia
   * @returns {Object} Map dari nama model ke instance model
   */
  getAllModels() {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    return this.models;
  }

  /**
   * Menghasilkan teks dari semua model dan menggabungkan hasilnya
   * @param {string} prompt Input teks
   * @param {object} options Opsi generasi teks
   * @returns {Promise<object>} Hasil generasi dari semua model
   */
  async generateFromAllModels(prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    try {
      logger.info('Menghasilkan teks dari semua model');
      
      const results = {};
      const promises = [];
      
      // Generasi teks dari setiap model
      for (const [name, model] of Object.entries(this.models)) {
        promises.push(
          model.generate(prompt, options)
            .then(text => {
              results[name] = text;
              return { name, text };
            })
            .catch(error => {
              logger.error(`Gagal menghasilkan teks dari model ${name}: ${error.message}`);
              results[name] = `ERROR: ${error.message}`;
              return { name, error: error.message };
            })
        );
      }
      
      await Promise.all(promises);
      
      return {
        prompt,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Gagal menghasilkan teks dari semua model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Memuat semua model ke dalam memori
   * @returns {Promise<object>} Status pemuatan model
   */
  async loadAllModels() {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    try {
      logger.info('Memuat semua model ke dalam memori');
      
      const results = {};
      const promises = [];
      
      // Muat setiap model
      for (const [name, model] of Object.entries(this.models)) {
        promises.push(
          model.load()
            .then(() => {
              results[name] = 'success';
              return { name, status: 'success' };
            })
            .catch(error => {
              logger.error(`Gagal memuat model ${name}: ${error.message}`);
              results[name] = `ERROR: ${error.message}`;
              return { name, status: 'error', error: error.message };
            })
        );
      }
      
      await Promise.all(promises);
      
      return {
        status: 'success',
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Gagal memuat semua model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Membebaskan semua model dari memori
   * @returns {Promise<object>} Status pembebasan model
   */
  async unloadAllModels() {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    try {
      logger.info('Membebaskan semua model dari memori');
      
      const results = {};
      const promises = [];
      
      // Bebaskan setiap model
      for (const [name, model] of Object.entries(this.models)) {
        promises.push(
          model.unload()
            .then(() => {
              results[name] = 'success';
              return { name, status: 'success' };
            })
            .catch(error => {
              logger.error(`Gagal membebaskan model ${name}: ${error.message}`);
              results[name] = `ERROR: ${error.message}`;
              return { name, status: 'error', error: error.message };
            })
        );
      }
      
      await Promise.all(promises);
      
      return {
        status: 'success',
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Gagal membebaskan semua model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mendapatkan informasi tentang semua model
   * @returns {object} Informasi model
   */
  getModelInfo() {
    if (!this.initialized) {
      throw new Error('ModelManager belum diinisialisasi, panggil init() terlebih dahulu');
    }
    
    const info = {};
    
    for (const [name, model] of Object.entries(this.models)) {
      info[name] = model.getInfo();
    }
    
    return {
      models: info,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const modelManager = new ModelManager();

module.exports = modelManager; 