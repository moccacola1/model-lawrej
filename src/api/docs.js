const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config/config');

// Definisi dokumentasi API dengan OpenAPI (Swagger)
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'API Sistem AI Lokal',
    version: '1.0.0',
    description: 'API untuk mengakses model AI lokal (LLaMA 2, Mistral 7B, dan GPT-J) dalam bahasa Indonesia',
    contact: {
      name: 'Developer API',
      email: 'developer@ai-api-sistem.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}/api`,
      description: 'Server Lokal'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error'
          },
          message: {
            type: 'string',
            example: 'Pesan error'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          data: {
            type: 'object'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'admin'
          },
          password: {
            type: 'string',
            example: 'password'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          expiresIn: {
            type: 'string',
            example: '1d'
          }
        }
      },
      GenerateRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            example: 'Jelaskan mengenai kecerdasan buatan.'
          },
          options: {
            type: 'object',
            properties: {
              temperature: {
                type: 'number',
                example: 0.7
              },
              maxTokens: {
                type: 'integer',
                example: 512
              },
              topP: {
                type: 'number',
                example: 0.95
              },
              topK: {
                type: 'integer',
                example: 40
              },
              repetitionPenalty: {
                type: 'number',
                example: 1.1
              }
            }
          }
        }
      },
      GenerateResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          data: {
            type: 'object',
            properties: {
              model: {
                type: 'string',
                example: 'llama'
              },
              prompt: {
                type: 'string',
                example: 'Jelaskan mengenai kecerdasan buatan.'
              },
              generated_text: {
                type: 'string',
                example: 'Kecerdasan buatan (Artificial Intelligence atau AI) adalah bidang ilmu komputer yang berfokus pada pengembangan sistem yang dapat melakukan tugas-tugas yang biasanya memerlukan kecerdasan manusia...'
              },
              timestamp: {
                type: 'string',
                example: '2023-07-27T18:30:15.123Z'
              }
            }
          }
        }
      },
      ModelInfo: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          data: {
            type: 'object',
            properties: {
              models: {
                type: 'object',
                properties: {
                  llama: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: 'LlamaModel'
                      },
                      path: {
                        type: 'string',
                        example: './models/llama2'
                      },
                      isLoaded: {
                        type: 'boolean',
                        example: true
                      }
                    }
                  },
                  mistral: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: 'MistralModel'
                      },
                      path: {
                        type: 'string',
                        example: './models/mistral7b'
                      },
                      isLoaded: {
                        type: 'boolean',
                        example: false
                      }
                    }
                  },
                  gptj: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: 'GptjModel'
                      },
                      path: {
                        type: 'string',
                        example: './models/gptj'
                      },
                      isLoaded: {
                        type: 'boolean',
                        example: false
                      }
                    }
                  }
                }
              },
              timestamp: {
                type: 'string',
                example: '2023-07-27T18:30:15.123Z'
              }
            }
          }
        }
      },
      ModelLoadResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          data: {
            type: 'object',
            properties: {
              model: {
                type: 'string',
                example: 'llama'
              },
              status: {
                type: 'string',
                example: 'success'
              },
              message: {
                type: 'string',
                example: 'Model llama berhasil dimuat'
              },
              timestamp: {
                type: 'string',
                example: '2023-07-27T18:30:15.123Z'
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/status': {
      get: {
        summary: 'Memeriksa status server',
        description: 'Endpoint untuk memeriksa apakah server API berfungsi',
        tags: ['Status'],
        security: [],
        responses: {
          '200': {
            description: 'Server berfungsi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'success'
                    },
                    message: {
                      type: 'string',
                      example: 'API Sistem AI berfungsi'
                    },
                    timestamp: {
                      type: 'string',
                      example: '2023-07-27T18:30:15.123Z'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login ke API',
        description: 'Endpoint untuk login dan mendapatkan token JWT',
        tags: ['Autentikasi'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse'
                }
              }
            }
          },
          '401': {
            description: 'Login gagal',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/models': {
      get: {
        summary: 'Mendapatkan informasi model',
        description: 'Endpoint untuk mendapatkan informasi tentang semua model AI yang tersedia',
        tags: ['Model'],
        responses: {
          '200': {
            description: 'Informasi model berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ModelInfo'
                }
              }
            }
          },
          '401': {
            description: 'Tidak diotorisasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Error server',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/generate/{model}': {
      post: {
        summary: 'Menghasilkan teks dengan model',
        description: 'Endpoint untuk menghasilkan teks dengan model AI tertentu',
        tags: ['Generasi'],
        parameters: [
          {
            name: 'model',
            in: 'path',
            required: true,
            description: 'Nama model (llama, mistral, gptj, all)',
            schema: {
              type: 'string',
              enum: ['llama', 'mistral', 'gptj', 'all']
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Teks berhasil dihasilkan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenerateResponse'
                }
              }
            }
          },
          '400': {
            description: 'Permintaan tidak valid',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Tidak diotorisasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Model tidak ditemukan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '429': {
            description: 'Terlalu banyak permintaan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Error server',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/models/{model}/load': {
      post: {
        summary: 'Memuat model ke memori',
        description: 'Endpoint untuk memuat model AI ke memori',
        tags: ['Model'],
        parameters: [
          {
            name: 'model',
            in: 'path',
            required: true,
            description: 'Nama model (llama, mistral, gptj, all)',
            schema: {
              type: 'string',
              enum: ['llama', 'mistral', 'gptj', 'all']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Model berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ModelLoadResponse'
                }
              }
            }
          },
          '401': {
            description: 'Tidak diotorisasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Model tidak ditemukan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Error server',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/models/{model}/unload': {
      post: {
        summary: 'Membebaskan model dari memori',
        description: 'Endpoint untuk membebaskan model AI dari memori',
        tags: ['Model'],
        parameters: [
          {
            name: 'model',
            in: 'path',
            required: true,
            description: 'Nama model (llama, mistral, gptj, all)',
            schema: {
              type: 'string',
              enum: ['llama', 'mistral', 'gptj', 'all']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Model berhasil dibebaskan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ModelLoadResponse'
                }
              }
            }
          },
          '401': {
            description: 'Tidak diotorisasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Model tidak ditemukan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Error server',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  }
};

// Router untuk dokumentasi API
const router = express.Router();

// Rute utama - menampilkan dokumentasi
router.get('/', (req, res) => {
  // HTML untuk menampilkan Swagger UI
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Dokumentasi API Sistem AI</title>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css" >
        <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin: 0; background: #fafafa; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"> </script>
        <script>
            window.onload = function() {
                window.ui = SwaggerUIBundle({
                    spec: ${JSON.stringify(swaggerDocs)},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout",
                    docExpansion: "list",
                    defaultModelsExpandDepth: 1
                });
            }
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Rute untuk mendapatkan spesifikasi OpenAPI dalam format JSON
router.get('/json', (req, res) => {
  res.json(swaggerDocs);
});

module.exports = router; 