const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const server = http.createServer(app);

const WebSocketServer = new WebSocket.Server({ server });

let botClients = {};
WebSocketServer.on("connection", (ws) => {
  console.log("new connection from ", ws.url);
  ws.send("connected to server");
  ws.on("message", function incoming(message, isBinary) {
    const msg = message.toString();
    // WebSocketServer.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message.toString());
    //   }
    // });
    const msgArr = msg.split("--");
    if (msgArr[0] === "bot" && !botClients[msgArr[1]]) {
      botClients[msgArr[1]] = { ws };
      console.log("increased to: ", botClients);
      ws.send("connected to server");
    } else if (msgArr[0] === "app") {
      if (botClients[msgArr[1]]) {
        if (botClients[msgArr[1]]["app"]) {
          ws.send("failed--The device is already connected to other app");
        } else {
          botClients[msgArr[1]]["app"] = ws;
          ws.send("success");
          botClients[msgArr[1]]["ws"].send("connect");
        }
      } else {
        ws.send("failed--The device doesn't exist");
      }
    }
  });

  const closeHandle = () => {
    for (let key of Object.keys(botClients)) {
      if (botClients[key]["ws"] === ws) {
        botClients[key]["app"]?.send("disconnect");
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

app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Listening to port 5000");
});

// const express = require("express");
// const http = require("http");
// const socketio = require("socket.io");
// const cors = require("cors");

// const app = express();

// const server = http.createServer(app);
// const io = new socketio.Server(server, {
//   cors: {
//     origin: "*",
//     credentials: true,
//   },
// });

// app.use(cors());

// io.on("connection", (socket) => {
//   const { id } = socket.client;
//   console.log(`new client session: ${id}`);

//   socket.on("disconnect", (e) => {
//     console.log("disconnected: ", e);
//   });
// });

// app.set("port", 5000);

// // Start server
// server.listen(5000, () => {
//   console.log("listening on *:5000");
// });
