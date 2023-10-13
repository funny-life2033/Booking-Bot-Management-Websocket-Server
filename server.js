const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);

const WebSocketServer = new WebSocket.Server({ server });

let botClients = [];
WebSocketServer.on("connection", (ws) => {
  ws.on("message", function incoming(message, isBinary) {
    const msg = message.toString();
    // WebSocketServer.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message.toString());
    //   }
    // });
    const msgStr = msg.split("-");
    if (msgStr[0] === "bot") {
      botClients.push({ ws, id: msgStr[1], requestingApps: [] });
      console.log("increased to: ", botClients);
      ws.send("connected to server");
    } else if (msgStr[0] === "app") {
      let bot = botClients.find((client) => client.id === msgStr[1]);
      if (bot) {
        const app = bot.requestingApps.find((app) => app.id === msgStr[1]);
        if (app) {
          ws.send("failed-You have already requested");
        } else {
          bot.requestingApps.push({ ws, id: msgStr[1] });
          botClients = botClients.map((client) => {
            if (client.id === msgStr[1]) {
              client.ws.send(`connecting-${msgStr[1]}`);
              return bot;
            } else return client;
          });
        }
      } else {
        ws.send("failed-This device doesn't exist");
      }
    }
  });

  const closeHandle = () => {
    let newBotClients = [];
    botClients.forEach((client) => {
      if (client.ws !== ws) {
        client.requestingApps = client.requestingApps.filter((app) => {
          if (app.ws === ws) {
            client.ws.send(`disconnecting-${app.id}`);
            return false;
          }
          return true;
        });
        newBotClients.push(client);
      }
    });
    botClients = newBotClients;
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
