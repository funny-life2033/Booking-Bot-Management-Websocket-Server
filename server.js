const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);

const WebSocketServer = new WebSocket.Server({ server });

let botClients = {};
WebSocketServer.on("connection", (ws) => {
  ws.on("message", function incoming(message, isBinary) {
    const msg = message.toString();
    // WebSocketServer.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message.toString());
    //   }
    // });
    const msgStr = msg.split("--");
    if (msgStr[0] === "bot" && !botClients[msgStr[1]]) {
      botClients[msgStr[1]] = { ws };
      console.log("increased to: ", botClients);
      ws.send("connected to server");
    } else if (msgStr[0] === "app") {
      if (botClients[msgStr[1]]) {
        if (botClients[msgStr[1]]["app"]) {
          ws.send("failed--The device is already connected to other app");
        } else {
          botClients[msgStr[1]]["app"] = ws;
          ws.send("success");
          botClients[msgStr[1]]["ws"].send("connect");
        }
      } else {
        ws.send("failed--The device doesn't exist");
      }
    }
  });

  const closeHandle = () => {
    for (let key of Object.keys(botClients)) {
      if (botClients[key]["ws"] === ws) {
        botClients[key]["app"].send("disconnect");
        delete botClients[key];
        break;
      } else if (botClients[key]["app"] === ws) {
        botClients[key]["app"] = null;
        botClients[key]["ws"].send("disconnect");
        break;
      }
    }
    console.log("reduced to: ", botClients);
  };

  ws.on("close", closeHandle);

  ws.on("error", closeHandle);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Listening to port 5000");
});
