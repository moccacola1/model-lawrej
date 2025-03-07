const logger = require('../utils/logger');

/**
 * Kelas dasar untuk semua model AI
 * Ini adalah kelas abstrak yang mendefinisikan antarmuka umum yang harus diimplementasikan
 * oleh semua model konkret seperti LLaMA, Mistral, dan GPT-J
 */
class BaseModel {
  constructor(config) {
    if (this.constructor === BaseModel) {
      throw new Error('BaseModel tidak dapat diinstansiasi langsung. Gunakan kelas turunan.');
    }
    
    this.config = config;
    this.modelPath = config.path;
    this.isLoaded = false;
    this.model = null;
  }

  /**
   * Memuat model ke dalam memori
   * @returns {Promise<boolean>} Status keberhasilan pemuatan
   */
  async load() {
    throw new Error('Metode load() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Menghasilkan teks berdasarkan prompt yang diberikan
   * @param {string} prompt Input teks untuk model
   * @param {object} options Opsi generasi teks (suhu, panjang maksimum, dll.)
   * @returns {Promise<string>} Teks yang dihasilkan
   */
  async generate(prompt, options = {}) {
    throw new Error('Metode generate() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Memperbarui model dengan data pelatihan baru
   * @param {Array} trainingData Data pelatihan untuk memperbarui model
   * @param {object} options Opsi pelatihan
   * @returns {Promise<object>} Hasil pelatihan
   */
  async train(trainingData, options = {}) {
    throw new Error('Metode train() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Mengevaluasi kinerja model pada dataset tertentu
   * @param {Array} evalData Data evaluasi
   * @returns {Promise<object>} Metrik evaluasi
   */
  async evaluate(evalData) {
    throw new Error('Metode evaluate() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Menyimpan model ke disk
   * @param {string} path Path untuk menyimpan model
   * @returns {Promise<boolean>} Status keberhasilan penyimpanan
   */
  async save(path) {
    throw new Error('Metode save() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Membebasan sumber daya model dari memori
   * @returns {Promise<boolean>} Status keberhasilan pembebasan
   */
  async unload() {
    throw new Error('Metode unload() harus diimplementasikan oleh kelas turunan');
  }

  /**
   * Mendapatkan informasi tentang model
   * @returns {object} Informasi model
   */
  getInfo() {
    return {
      name: this.constructor.name,
      path: this.modelPath,
      isLoaded: this.isLoaded
    };
  }
}

module.exports = BaseModel; 