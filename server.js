const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");

const app = express();

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: (origin, callback) => {
      console.log("socket connection requestion from: ", origin);
      callback(null, true);
    },
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("connecting request from: ", origin);
      callback(null, true);
    },
    credentials: true,
  })
);

let adiBotClients = {};
let studentBotClients = {};
let appClient;

io.on("connection", (socket) => {
  const { id } = socket.client;
  console.log(`new client session: ${id}`);

  socket.on("app connect", () => {
    if (appClient) {
      socket.emit("app connect failed", "The other app is already connected");
    } else {
      appClient = socket;

      let connectedAdiBots = Object.keys(adiBotClients);
      let connectedStudentBots = Object.keys(studentBotClients);

      for (let connectedAdiBot of connectedAdiBots) {
        adiBotClients[connectedAdiBot].emit("app connect");
      }

      for (let connectedStudentBot of connectedStudentBots) {
        studentBotClients[connectedStudentBot].emit("app connect");
      }

      socket.emit("app connect success", {
        connectedAdiBots,
        connectedStudentBots,
      });
    }
  });

  socket.on("adi bot connect", (botId) => {
    socket.botId = botId;
    adiBotClients[botId] = socket;

    if (appClient) {
      appClient.emit("adi bot connect", botId);
      socket.emit("app connect");
    }

    console.log(adiBotClients);
  });

  socket.on("student bot connect", (botId) => {
    socket.botId = botId;
    studentBotClients[botId] = socket;

    if (appClient) {
      appClient.emit("student bot connect", botId);
    }
  });

  socket.on("message", (event, { to, data }) => {
    console.log(event, data);
    if (to) {
      if (adiBotClients[to]) {
        adiBotClients[to].emit(event, data);
      } else if (studentBotClients[to]) {
        studentBotClients[to].emit(event, data);
      }
    } else if (appClient) {
      appClient.emit(event, data);
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnected: ", socket.client.id);

    if (appClient && appClient.client.id === socket.client.id) {
      appClient = null;

      let connectedAdiBots = Object.keys(adiBotClients);
      let connectedStudentBots = Object.keys(studentBotClients);

      for (let connectedAdiBot of connectedAdiBots) {
        adiBotClients[connectedAdiBot].emit("app disconnect");
      }

      for (let connectedStudentBot of connectedStudentBots) {
        studentBotClients[connectedStudentBot].emit("app disconnect");
      }
    } else if (socket.botId) {
      if (adiBotClients[socket.botId]) {
        if (appClient) {
          appClient.emit("adi bot disconnect", socket.botId);
        }
        delete adiBotClients[socket.botId];
      } else if (studentBotClients[socket.botId]) {
        if (appClient) {
          appClient.emit("student bot disconnect", socket.botId);
        }
        delete studentBotClients[socket.botId];
      }
    }

    console.log("appClient", appClient);
    console.log("adiBotClients", adiBotClients);
    console.log("studentBotClients", studentBotClients);
  });
});

app.set("port", 5000);

// Start server
server.listen(5000, () => {
  console.log("listening on *:5000");
});
