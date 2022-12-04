//startup variables
const username = prompt('Enter your username', 'guest') || 'guest';
const sessionID = `${new Date().getTime()}${Math.round(Math.random() * 10000000)}`;
console.log(username, sessionID);
const textArea = document.querySelector('#text');
const sendBtn = document.querySelector('#send');
const chat = document.querySelector('#chat');
const fileInput = document.querySelector('#file');
const userSpan = (document.querySelector('#username').innerHTML += username);

//web-socket
const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
let socket;

function startSocket() {
  socket = new WebSocket(`${protocol}://${window.location.host}/`);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    showMassage(msg);
  };

  socket.onclose = () => {
    startSocket();
    console.log('reconnect');
  };
}

startSocket();

socket.onopen = () => {
  socket.send(
    JSON.stringify({
      id: sessionID,
      username: username,
      message: '',
      method: 'connection',
    })
  );
  fetchData();
};

//recive all data
async function fetchData() {
  const data = await (await fetch('/messages')).json();
  data.forEach((msg) => {
    showMassage(msg);
  });
}

//client events
window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

sendBtn.addEventListener('click', () => {
  sendMessage();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];

  const formData = new FormData();
  formData.append('file', file);

  const res = await (await fetch('/upload', { method: 'POST', body: formData })).json();

  const msg = {
    id: sessionID,
    username: username,
    message: res.filename,
    method: 'file',
  };

  socket.send(JSON.stringify(msg));
  console.log('file send');
  showMassage(msg);
  e.target.value = '';
});

//functions
function sendMessage() {
  if (!textArea.value.trim()) {
    return;
  }

  socket.send(
    JSON.stringify({
      id: sessionID,
      username: username,
      message: textArea.value,
      method: 'send',
    })
  );
  textArea.value = '';
  console.log('message send');
}

function showMassage(msg) {
  switch (msg.method) {
    case 'connection':
      chat.insertAdjacentHTML('afterbegin', `<div class="message">${msg.username} has joined chat!</div>`);
      break;
    case 'send':
      chat.insertAdjacentHTML('afterbegin', `<div class="message">${msg.username}: ${msg.message}</div>`);
      break;
    case 'file':
      chat.insertAdjacentHTML(
        'afterbegin',
        `
            <div class="message">
                ${msg.username} sent file:
            </div>
            <img class="message" src="${msg.message}" alt="${msg.message}" />
        `
      );
      break;
    default:
      break;
  }
}
