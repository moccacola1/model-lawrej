const fs = require('fs');
const path = require('path');
const modelManager = require('../models/ModelManager');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Kelas Trainer bertanggung jawab untuk melatih model AI dengan data baru
 */
class Trainer {
  constructor() {
    this.trainingConfig = config.training;
    this.modelManager = modelManager;
    this.dataDir = this.trainingConfig.dataDir;
    this.checkpointDir = this.trainingConfig.checkpointDir;
    
    // Memastikan direktori ada
    this._ensureDirectoriesExist();
  }

  /**
   * Memastikan direktori-direktori yang diperlukan ada
   * @private
   */
  _ensureDirectoriesExist() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info(`Direktori data pelatihan dibuat: ${this.dataDir}`);
    }
    
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
      logger.info(`Direktori checkpoint dibuat: ${this.checkpointDir}`);
    }
  }

  /**
   * Memuat data pelatihan dari file
   * @param {string} filePath Path file data pelatihan
   * @returns {Array} Data pelatihan
   */
  async loadTrainingData(filePath) {
    try {
      logger.info(`Memuat data pelatihan dari: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File data pelatihan tidak ditemukan: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const trainingData = JSON.parse(fileContent);
      
      logger.info(`Data pelatihan berhasil dimuat: ${trainingData.length} sampel`);
      return trainingData;
    } catch (error) {
      logger.error(`Gagal memuat data pelatihan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mencari semua file data pelatihan di direktori data
   * @returns {Array<string>} Daftar path file data pelatihan
   */
  findTrainingDataFiles() {
    try {
      logger.info(`Mencari file data pelatihan di: ${this.dataDir}`);
      
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.dataDir, file));
      
      logger.info(`Ditemukan ${files.length} file data pelatihan`);
      return files;
    } catch (error) {
      logger.error(`Gagal mencari file data pelatihan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Menggabungkan data pelatihan dari beberapa file
   * @param {Array<string>} files Daftar path file data pelatihan
   * @returns {Array} Data pelatihan gabungan
   */
  async mergeTrainingData(files) {
    try {
      logger.info('Menggabungkan data pelatihan dari beberapa file');
      
      let mergedData = [];
      
      for (const file of files) {
        const data = await this.loadTrainingData(file);
        mergedData = mergedData.concat(data);
      }
      
      logger.info(`Data gabungan: ${mergedData.length} sampel`);
      return mergedData;
    } catch (error) {
      logger.error(`Gagal menggabungkan data pelatihan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mempersiapkan data pelatihan untuk model tertentu
   * @param {Array} data Data pelatihan mentah
   * @param {string} modelType Jenis model ('llama', 'mistral', 'gptj')
   * @returns {Array} Data pelatihan yang telah dipersiapkan
   */
  prepareTrainingData(data, modelType) {
    try {
      logger.info(`Mempersiapkan data pelatihan untuk model ${modelType}`);
      
      // Format data pelatihan akan berbeda untuk setiap model
      // Implementasi ini adalah contoh sederhana
      
      const preparedData = data.map(item => {
        return {
          input: item.input || item.prompt || '',
          output: item.output || item.completion || '',
          metadata: item.metadata || {}
        };
      });
      
      logger.info(`Data pelatihan berhasil dipersiapkan: ${preparedData.length} sampel`);
      return preparedData;
    } catch (error) {
      logger.error(`Gagal mempersiapkan data pelatihan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Melatih model dengan data pelatihan
   * @param {string} modelType Jenis model ('llama', 'mistral', 'gptj', 'all')
   * @param {Array} trainingData Data pelatihan
   * @param {object} options Opsi pelatihan
   * @returns {Promise<object>} Hasil pelatihan
   */
  async trainModel(modelType, trainingData, options = {}) {
    try {
      // Pastikan model manager diinisialisasi
      if (!this.modelManager.initialized) {
        await this.modelManager.init();
      }
      
      const mergedOptions = {
        ...this.trainingConfig,
        ...options
      };
      
      logger.info(`Memulai pelatihan model ${modelType} dengan ${trainingData.length} sampel`);
      
      if (modelType.toLowerCase() === 'all') {
        // Melatih semua model
        const results = {};
        
        for (const [name, model] of Object.entries(this.modelManager.getAllModels())) {
          const preparedData = this.prepareTrainingData(trainingData, name);
          results[name] = await model.train(preparedData, mergedOptions);
        }
        
        logger.info('Pelatihan semua model selesai');
        return {
          status: 'success',
          models: results,
          timestamp: new Date().toISOString()
        };
      } else {
        // Melatih satu model
        const model = this.modelManager.getModel(modelType);
        const preparedData = this.prepareTrainingData(trainingData, modelType);
        const result = await model.train(preparedData, mergedOptions);
        
        logger.info(`Pelatihan model ${modelType} selesai`);
        return {
          status: 'success',
          model: modelType,
          result,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error(`Gagal melatih model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Memperbarui model secara berkala dengan data baru
   * @param {string} modelType Jenis model ('llama', 'mistral', 'gptj', 'all')
   * @param {number} interval Interval dalam milidetik (default: 24 jam)
   * @returns {object} Interval ID dan informasi
   */
  schedulePeriodicTraining(modelType, interval = 24 * 60 * 60 * 1000) {
    try {
      logger.info(`Menjadwalkan pelatihan berkala untuk model ${modelType} setiap ${interval/1000/60/60} jam`);
      
      const intervalId = setInterval(async () => {
        try {
          logger.info('Memulai pelatihan berkala terjadwal');
          
          // Cari file data pelatihan
          const files = this.findTrainingDataFiles();
          
          if (files.length === 0) {
            logger.warn('Tidak ada file data pelatihan ditemukan, melewati pelatihan berkala');
            return;
          }
          
          // Gabungkan data pelatihan
          const mergedData = await this.mergeTrainingData(files);
          
          // Latih model
          await this.trainModel(modelType, mergedData);
          
          logger.info('Pelatihan berkala terjadwal selesai');
        } catch (error) {
          logger.error(`Gagal melakukan pelatihan berkala terjadwal: ${error.message}`);
        }
      }, interval);
      
      return {
        intervalId,
        modelType,
        interval,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Gagal menjadwalkan pelatihan berkala: ${error.message}`);
      throw error;
    }
  }

  /**
   * Membatalkan pelatihan berkala
   * @param {number} intervalId ID interval yang dikembalikan oleh schedulePeriodicTraining
   * @returns {boolean} Status keberhasilan pembatalan
   */
  cancelPeriodicTraining(intervalId) {
    try {
      clearInterval(intervalId);
      logger.info(`Pelatihan berkala dengan ID ${intervalId} dibatalkan`);
      return true;
    } catch (error) {
      logger.error(`Gagal membatalkan pelatihan berkala: ${error.message}`);
      throw error;
    }
  }

  /**
   * Menyimpan checkpoint model setelah pelatihan
   * @param {string} modelType Jenis model
   * @returns {Promise<string>} Path checkpoint
   */
  async saveModelCheckpoint(modelType) {
    try {
      // Pastikan model manager diinisialisasi
      if (!this.modelManager.initialized) {
        await this.modelManager.init();
      }
      
      logger.info(`Menyimpan checkpoint untuk model ${modelType}`);
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const checkpointPath = path.join(this.checkpointDir, `${modelType}_${timestamp}`);
      
      const model = this.modelManager.getModel(modelType);
      await model.save(checkpointPath);
      
      logger.info(`Checkpoint disimpan ke: ${checkpointPath}`);
      return checkpointPath;
    } catch (error) {
      logger.error(`Gagal menyimpan checkpoint model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Membuat contoh file data pelatihan
   * @param {string} outputPath Path file output (opsional)
   * @returns {string} Path file yang dibuat
   */
  createSampleTrainingFile(outputPath = null) {
    try {
      const sampleData = [
        {
          input: "Apa ibu kota Indonesia?",
          output: "Ibu kota Indonesia adalah Jakarta.",
          metadata: {
            category: "pengetahuan umum",
            difficulty: "mudah",
            tags: ["geografi", "indonesia"]
          }
        },
        {
          input: "Jelaskan tentang algoritma pencarian biner.",
          output: "Pencarian biner adalah algoritma pencarian yang bekerja pada array yang sudah diurutkan. Algoritma ini membagi array menjadi dua bagian dan membandingkan nilai tengah dengan nilai yang dicari. Jika nilai tengah sama dengan nilai yang dicari, pencarian selesai. Jika nilai tengah lebih besar, cari di bagian kiri. Jika nilai tengah lebih kecil, cari di bagian kanan. Proses ini berulang hingga nilai ditemukan atau area pencarian kosong.",
          metadata: {
            category: "ilmu komputer",
            difficulty: "sedang",
            tags: ["algoritma", "pencarian", "pemrograman"]
          }
        },
        {
          input: "Buatkan program sederhana untuk menghitung faktorial dalam bahasa Python.",
          output: "```python\ndef faktorial(n):\n    if n == 0 or n == 1:\n        return 1\n    else:\n        return n * faktorial(n-1)\n\n# Contoh penggunaan\nangka = int(input(\"Masukkan angka: \"))\nhasil = faktorial(angka)\nprint(f\"Faktorial dari {angka} adalah {hasil}\")\n```",
          metadata: {
            category: "pemrograman",
            difficulty: "sedang",
            tags: ["python", "faktorial", "rekursi"]
          }
        }
      ];
      
      const finalPath = outputPath || path.join(this.dataDir, `sample_data_${Date.now()}.json`);
      
      // Pastikan direktori ada
      const dir = path.dirname(finalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(finalPath, JSON.stringify(sampleData, null, 2), 'utf-8');
      
      logger.info(`File contoh data pelatihan dibuat: ${finalPath}`);
      return finalPath;
    } catch (error) {
      logger.error(`Gagal membuat file contoh data pelatihan: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
const trainer = new Trainer();

// CLI handler jika dijalankan langsung
if (require.main === module) {
  (async () => {
    try {
      logger.info('Memulai pelatihan model...');
      
      // Inisialisasi model manager
      await modelManager.init();
      
      // Buat contoh file data pelatihan jika belum ada file data pelatihan
      const files = trainer.findTrainingDataFiles();
      if (files.length === 0) {
        logger.info('Tidak ada file data pelatihan ditemukan, membuat file contoh');
        trainer.createSampleTrainingFile();
      }
      
      // Cari file data pelatihan lagi setelah membuat contoh
      const trainingFiles = trainer.findTrainingDataFiles();
      
      if (trainingFiles.length === 0) {
        logger.error('Tidak dapat menemukan file data pelatihan');
        process.exit(1);
      }
      
      // Gabungkan data pelatihan
      const mergedData = await trainer.mergeTrainingData(trainingFiles);
      
      // Latih semua model
      const results = await trainer.trainModel('all', mergedData);
      
      logger.info('Pelatihan selesai dengan hasil:', results);
      
      // Simpan checkpoint untuk semua model
      for (const modelType of Object.keys(modelManager.getAllModels())) {
        await trainer.saveModelCheckpoint(modelType);
      }
      
      logger.info('Semua model berhasil dilatih dan checkpoint disimpan');
    } catch (error) {
      logger.error(`Terjadi kesalahan selama pelatihan: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = trainer; 