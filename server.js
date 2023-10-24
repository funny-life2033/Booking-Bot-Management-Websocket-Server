const express = require("express");
const https = require("https");
const socketio = require("socket.io");
const cors = require("cors");

const app = express();

const server = https.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: (origin, callback) => {
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
      callback(null, true);
    },
    credentials: true,
  })
);

let adiBotClients = {};
let studentBotClients = {};
let appClient;

io.on("connection", (socket) => {
  socket.on("app connect", () => {
    console.log("app connect request");

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
    console.log("adi bot connect request");

    socket.botId = botId;
    adiBotClients[botId] = socket;

    if (appClient) {
      appClient.emit("adi bot connect", botId);
      socket.emit("app connect");
    }
  });

  socket.on("student bot connect", (botId) => {
    console.log("student bot connect request");

    socket.botId = botId;
    studentBotClients[botId] = socket;

    if (appClient) {
      appClient.emit("student bot connect", botId);
    }
  });

  socket.on("message", (event, data) => {
    console.log(event, data);
    if (data.to) {
      if (adiBotClients[data.to]) {
        adiBotClients[data.to].emit(event, data);
      } else if (studentBotClients[data.to]) {
        studentBotClients[data.to].emit(event, data);
      }
    } else if (appClient) {
      appClient.emit(event, { ...data, botId: socket.botId });
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
  });
});

app.set("port", 5000);

// Start server
server.listen(5000, () => {
  console.log("listening on *:5000");
});
