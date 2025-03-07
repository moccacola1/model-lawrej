# Sistem AI API Lokal

Sebuah sistem API berbasis Node.js untuk mengintegrasikan dan menggunakan model-model AI seperti LLaMA 2, Mistral 7B, dan GPT-J secara lokal dengan dukungan penuh bahasa Indonesia.

## Fitur Utama

- **Integrasi Multi-Model:** Menggabungkan kekuatan LLaMA 2, Mistral 7B, dan GPT-J dalam satu sistem
- **API Terpadu:** Antarmuka API yang konsisten untuk semua model
- **Pengelolaan Memori:** Memuat dan membebaskan model sesuai kebutuhan
- **Pelatihan Model:** Mendukung update model dan fine-tuning dengan data lokal
- **Keamanan:** Autentikasi dengan JWT dan rate limiting
- **Dokumentasi Lengkap:** Swagger UI untuk eksplorasi dan pengujian API
- **Pengoptimalan Lokal:** Dirancang untuk berjalan sepenuhnya di lingkungan lokal

## Persyaratan Sistem

- Node.js v14.0.0 atau lebih baru
- NPM v6.0.0 atau lebih baru
- RAM minimal 16GB (rekomendasi: 32GB atau lebih)
- Ruang disk minimal 20GB untuk model-model
- (Opsional) GPU dengan CUDA untuk performa yang lebih baik

## Instalasi

1. Klon repositori ini:
   ```bash
   git clone https://github.com/moccacola1/model-lawrej.git
   cd ai-api-sistem-lokal
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Salin file konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```

4. Unduh model-model AI:
   ```bash
   # Buat direktori untuk model
   mkdir -p models/llama2 models/mistral7b models/gptj
   
   # Gunakan script unduh (jika tersedia)
   npm run download-models
   
   # ATAU unduh manual dari sumber resmi:
   # LLaMA 2: https://github.com/facebookresearch/llama/
   # Mistral 7B: https://huggingface.co/mistralai/Mistral-7B-v0.1
   # GPT-J: https://huggingface.co/EleutherAI/gpt-j-6b
   ```

5. Edit file `.env` sesuai dengan lokasi model dan kebutuhan sistem anda.

## Memulai

1. Jalankan server API:
   ```bash
   npm start
   ```

2. Atau dalam mode pengembangan (dengan auto-reload):
   ```bash
   npm run dev
   ```

3. Akses dokumentasi API di browser:
   ```
   http://localhost:3000/api/docs
   ```

## Penggunaan API

### Autentikasi

Semua endpoint API (kecuali `/api/status` dan `/api/auth/login`) memerlukan autentikasi JWT.

1. Dapatkan token autentikasi:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Gunakan token dalam header Authorization:
   ```bash
   curl -X GET http://localhost:3000/api/models \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Endpoint Utama

- **GET /api/status**: Memeriksa status server API
- **POST /api/auth/login**: Login untuk mendapatkan token JWT
- **GET /api/models**: Mendapatkan informasi semua model
- **POST /api/generate/{model}**: Menghasilkan teks dengan model tertentu
- **POST /api/models/{model}/load**: Memuat model ke dalam memori
- **POST /api/models/{model}/unload**: Membebaskan model dari memori

Lihat dokumentasi API lengkap di `/api/docs` untuk informasi lebih detail.

## Pelatihan Model

1. Siapkan data pelatihan dalam format JSON (lihat contoh di `/src/training/data/sample_data.json`)

2. Jalankan pelatihan:
   ```bash
   npm run train
   ```

3. Untuk pelatihan model tertentu:
   ```bash
   node src/training/trainer.js --model=llama
   ```

## Struktur Proyek

```
/
├── src/                    # Kode sumber
│   ├── api/                # Implementasi API
│   │   ├── server.js       # Server Express
│   │   └── docs.js         # Dokumentasi API (Swagger)
│   ├── models/             # Implementasi model AI
│   │   ├── BaseModel.js    # Kelas dasar untuk semua model
│   │   ├── LlamaModel.js   # Implementasi LLaMA 2
│   │   ├── MistralModel.js # Implementasi Mistral 7B
│   │   ├── GptjModel.js    # Implementasi GPT-J
│   │   └── ModelManager.js # Pengelola semua model
│   ├── training/           # Modul pelatihan model
│   │   ├── trainer.js      # Implementasi pelatihan
│   │   ├── data/           # Data pelatihan
│   │   └── checkpoints/    # Checkpoint model
│   ├── utils/              # Utilitas umum
│   │   └── logger.js       # Sistem logging
│   └── config/             # Konfigurasi
│       └── config.js       # Konfigurasi aplikasi
├── models/                 # Model AI (unduh sendiri)
│   ├── llama2/             # Model LLaMA 2
│   ├── mistral7b/          # Model Mistral 7B
│   └── gptj/               # Model GPT-J
├── logs/                   # Log aplikasi
├── .env.example            # Contoh file lingkungan
├── package.json            # Dependensi dan script
└── README.md               # Dokumentasi
```

## Menggunakan Sistem dalam Bot Discord

Sistem ini kompatibel dengan Node.js, sehingga dapat diintegrasikan dengan bot Discord:

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Konfigurasi API
const API_URL = 'http://localhost:3000/api';
let apiToken = null;

// Login ke API untuk mendapatkan token
async function loginToApi() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'password'
    });
    apiToken = response.data.token;
    console.log('API login berhasil');
  } catch (error) {
    console.error('Gagal login ke API:', error);
  }
}

// Menghasilkan teks dari model
async function generateText(model, prompt) {
  try {
    const response = await axios.post(`${API_URL}/generate/${model}`, 
      { prompt },
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    );
    return response.data.data.generated_text;
  } catch (error) {
    console.error('Gagal menghasilkan teks:', error);
    return 'Terjadi kesalahan saat menghasilkan teks.';
  }
}

// Event handler ketika bot siap
client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  await loginToApi();
});

// Event handler untuk pesan
client.on('messageCreate', async (message) => {
  // Abaikan pesan dari bot
  if (message.author.bot) return;

  // Contoh command: !generate llama Jelaskan tentang kecerdasan buatan.
  if (message.content.startsWith('!generate')) {
    const args = message.content.split(' ');
    if (args.length < 3) {
      message.reply('Format: !generate <model> <prompt>');
      return;
    }

    const model = args[1]; // llama, mistral, gptj, atau all
    const prompt = args.slice(2).join(' ');
    
    message.channel.sendTyping();
    message.reply('Menghasilkan teks... Mohon tunggu.');
    
    try {
      const generatedText = await generateText(model, prompt);
      message.reply(`**Hasil dari model ${model}:**\n${generatedText}`);
    } catch (error) {
      message.reply('Terjadi kesalahan saat menghasilkan teks.');
    }
  }
});

// Login bot Discord
client.login('DISCORD_BOT_TOKEN');
```

## Keamanan

- Gunakan `.env` untuk menyimpan konfigurasi sensitif
- Ubah kredensial default di file konfigurasi
- Buat mekanisme autentikasi yang lebih kokoh untuk produksi
- Batasi akses ke API menggunakan firewall

## Peringatan

- Model AI memerlukan sumber daya komputasi yang signifikan
- Penggunaan GPU sangat direkomendasikan untuk performa optimal
- Fitur fine-tuning memerlukan pemahaman tentang pembelajaran mesin

## Lisensi

Proyek ini dilisensikan di bawah lisensi MIT. Lihat file LICENSE untuk detail.

## Kontribusi

Kontribusi selalu disambut baik! Silakan buat issue atau pull request untuk meningkatkan sistem ini. 
