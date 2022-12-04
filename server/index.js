require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');
const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');
const app = express();
const WSServer = require('express-ws')(app);
const aWss = WSServer.getWss();

const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;
const DATABASE = [];

app.use(express.static(path.resolve('client')));

app.ws('/', (ws, req) => {
  console.log('connection is OK');
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    switch (message.method) {
      case 'connection':
        saveToDB(message);
        connectionHandler(ws, message);
        break;
      default:
        saveToDB(message);
        console.log(message);
        broadcastConnection(ws, message, JSON.stringify(message));
        break;
    }
  });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const form = new FormData();

    form.append('image', req.file.buffer.toString('base64'));

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMG_BB_KEY}`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    const image = response.data.data.url;

    console.log(image, 'UPLOADED');

    return res.json({ filename: image });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'cannot save file' });
  }
});

app.get('/messages', (req, res) => {
  res.json(DATABASE);
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve('client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`server started on port: ${PORT}...`);
});

function connectionHandler(ws, msg) {
  ws.id = msg.id;
  broadcastConnection(ws, msg, JSON.stringify(msg));
}

function broadcastConnection(ws, msg, alert) {
  aWss.clients.forEach((client) => {
    if (client.id !== msg.id || msg.method === 'send') {
      client.send(alert);
    }
  });
}

function saveToDB(message) {
  DATABASE.push(message);
}
