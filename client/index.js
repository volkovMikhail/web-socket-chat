//startup variables
const username = prompt('Enter your username', 'guest') || 'guest';
const sessionID = `${new Date().getTime()}${Math.round(Math.random() * 10000000)}`;
console.log(username, sessionID);
const textArea = document.querySelector('#text');
const sendBtn = document.querySelector('#send');
const chat = document.querySelector('#chat');
const userSpan = (document.querySelector('#username').innerHTML += username);

//web-socket
const socket = new WebSocket('ws://localhost:5000/');

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

socket.onmessage = (event) => {
    chat.insertAdjacentHTML(
        'afterbegin',
        `
        <div class="message">${event.data}</div>
        `
    );
};

//recive all data
async function fetchData() {
    const data = await (await fetch('/messages')).json();
    data.forEach((msg) => {
        switch (msg.method) {
            case 'connection':
                chat.insertAdjacentHTML(
                    'afterbegin',
                    `
                    <div class="message">${msg.username} has joined chat!</div>
                    `
                );
                break;

            default:
                chat.insertAdjacentHTML(
                    'afterbegin',
                    `
                    <div class="message">${msg.username}: ${msg.message}</div>
                    `
                );
                break;
        }
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

//functions
function sendMessage() {
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
