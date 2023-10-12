const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);

const WebSocketServer = new WebSocket.Server({ server });

WebSocketServer.on("connection", (ws) => {
  ws.on("message", function incoming(message, isBinary) {
    console.log(message.toString(), isBinary);
    WebSocketServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Listening to port 5000");
});
