require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  models: {
    llama: {
      path: process.env.LLAMA_MODEL_PATH || './models/llama2',
      contextSize: 2048,
      batchSize: 512,
      threads: 4
    },
    mistral: {
      path: process.env.MISTRAL_MODEL_PATH || './models/mistral7b',
      contextSize: 2048,
      batchSize: 512,
      threads: 4
    },
    gptj: {
      path: process.env.GPTJ_MODEL_PATH || './models/gptj',
      contextSize: 2048,
      batchSize: 512,
      threads: 4
    }
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key_tidak_aman',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 menit
      max: 100 // batas 100 request per windowMs
    }
  },
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ai-api-sistem'
  },
  training: {
    batchSize: parseInt(process.env.TRAINING_BATCH_SIZE) || 16,
    epochs: parseInt(process.env.TRAINING_EPOCHS) || 3,
    learningRate: parseFloat(process.env.LEARNING_RATE) || 0.00005,
    checkpointDir: './src/training/checkpoints',
    dataDir: './src/training/data'
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 3600
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    file: './logs/app.log'
  }
}; 