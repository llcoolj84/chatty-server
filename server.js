// declare variables 
const express = require('express');
const SocketServer = require('ws').Server;
const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;

// Create a new express server 
const server = express()
    // Make the express server serve static assets (html, javascript, css) from the /public folder
    .use(express.static('public'))
    .listen(PORT, 'localhost', () => console.log(`Chatty Server listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Function to update client counts
let updateClientCount = () => {
    let cnxObj = {};
    cnxObj.type = "connection";
    cnxObj.count = wss.clients.size;
    cnxObj.id = uuidv4();
    return cnxObj;
};

// Callback that runs when a client connects to the server
wss.on('connection', (ws) => {
    let seconds = Date.now();
    let timestamp = new Date(seconds);
    // console.log(`Client connected to Chatty Server at ${timestamp}`);
    // console.log("Number of connections:", wss.clients.size);

    // Function to broadcast server traffic
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            };
        });
    };

    // Send # of connections to each client
    wss.broadcast(updateClientCount());

    // This is where we recieve the incoming message, give it an id, then broadcast it
    ws.on('message', function incoming(data) {
        let newMessage = JSON.parse(data);
        //assign a new uuidv4 for the incoming message
        newMessage.id = uuidv4();

        //switch statement to decide if it's a notificaiton or incoming message 
        switch (newMessage.type) {
            case 'system':
                wss.broadcast(newMessage);
                break;
            default:
                let { username, content, id, color } = newMessage;
                console.log(`User ${username} said ${content} (ref: ${id}) (color: ${color})`);
                wss.broadcast(newMessage);
        };
    });

    // Callback for when client closes the socket
    ws.on('close', () => {
        console.log('Client disconnected from Chatty Server');
        console.log("Number of connections:", wss.clients.size);

        // Update # of connections
        wss.broadcast(updateClientCount());

    });
});