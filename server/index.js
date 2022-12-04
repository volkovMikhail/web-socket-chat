const path = require('path');
const express = require('express');
const multer = require('multer');
const app = express();
const WSServer = require('express-ws')(app);
const aWss = WSServer.getWss();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '..', 'client'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

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

app.post('/upload', upload.single('file'), function (req, res) {
  return res.json({ filename: req.file.filename });
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
