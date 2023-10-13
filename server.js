const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);

const WebSocketServer = new WebSocket.Server({ server });

WebSocketServer.on("connection", (ws) => {
  ws.on("message", function incoming(message, isBinary) {
    const msg = message.toString();
    console.log(msg, isBinary);
    // WebSocketServer.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message.toString());
    //   }
    // });
    ws.send(msg);
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Listening to port 5000");
});
