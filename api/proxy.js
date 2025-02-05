const express = require('express');
const axios = require('axios');
const app = express();

// Middleware для обработки JSON
app.use(express.json());

// Middleware для настройки заголовков CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Если это preflight-запрос, ответьте сразу
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Маршрут для проксирования запросов
app.use('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    console.log(`Received request: ${req.method} ${targetUrl}`);
    console.log(`Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Body: ${JSON.stringify(req.body)}`);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host
      },
      timeout: 10000 // Увеличиваем тайм-аут до 10 секунд
    });

    console.log(`Response from target: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data)}`);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Error response: ${JSON.stringify(error.response.data)}`);
      res.status(error.response.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Экспорт обработчика для Vercel
module.exports = app;
