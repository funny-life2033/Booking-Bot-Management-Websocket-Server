require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const adiClientRoute = require("./routes/adiClientRoute");
const AdiClient = require("./models/adiClient");

connectDB();

const app = express();

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    // transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);

app.use("/adiClient", adiClientRoute);

let adiBotClients = {};
let adiBotUserClients = {};
let studentBotClients = {};
let studentBotUserClients = {};
let appClient;

io.on("connection", (socket) => {
  socket.on("app connect", () => {
    console.log("app connect request");

    if (appClient) {
      socket.emit("app connect failed", "The other app is already connected");
    } else {
      appClient = socket;

      let connectedAdiBots = Object.keys(adiBotClients);
      let connectedAdiBotUsers = Object.keys(adiBotUserClients);
      // let connectedStudentBots = Object.keys(studentBotClients);
      // let connectedStudentBotUsers = Object.keys(studentBotUserClients);

      for (let connectedAdiBot of connectedAdiBots) {
        adiBotClients[connectedAdiBot].emit("app connect");
      }

      for (let connectedAdiBotUser of connectedAdiBotUsers) {
        adiBotUserClients[connectedAdiBotUser].emit("app connect");
      }

      // for (let connectedStudentBot of connectedStudentBots) {
      //   studentBotClients[connectedStudentBot].emit("app connect");
      // }

      // for (let connectedStudentBotUser of connectedStudentBotUsers) {
      //   studentBotUserClients[connectedStudentBotUser].emit("app connect");
      // }

      socket.emit("app connect success", {
        connectedAdiBots,
      });
    }
  });

  socket.on("adi bot connect", async (username) => {
    console.log("adi bot connect request");

    const client = await AdiClient.findOne({ username: username });
    if (!client) {
      return socket.emit(
        "adi bot connect failed",
        "This username is not registered"
      );
    }

    if (adiBotClients[username]) {
      return socket.emit(
        "adi bot connect failed",
        "The other bot is already connected by the username"
      );
    }

    socket.username = username;
    adiBotClients[username] = socket;

    socket.emit("adi bot connect success", username);

    if (appClient) {
      appClient.emit("adi bot connect", username);
      socket.emit("app connect");
    }
  });

  socket.on("adi client connect", (token) => {
    console.log("adi client connect request");

    try {
      jwt.verify(token, process.env.TOKEN_KEY, (err, data) => {
        if (err) {
          socket.emit("adi client connect failed");
        } else {
          if (adiBotUserClients[data.username]) {
            return socket.emit(
              "adi client connect failed",
              "The other client app is already connected"
            );
          }
          socket.username = data.username;
          adiBotUserClients[data.username] = socket;

          if (appClient) {
            appClient.emit("adi client connect", data.username);
            socket.emit("app connect");
          }
        }
      });
    } catch (error) {
      console.log(error);
      socket.emit("adi client connect failed");
    }
  });

  socket.on("student bot connect", (username) => {
    console.log("student bot connect request");

    socket.username = username;
    studentBotClients[username] = socket;

    if (appClient) {
      appClient.emit("student bot connect", username);
    }
  });

  socket.on("adi bot reserved slots", (data) => {
    if (socket.username && adiBotClients[socket.username]) {
      if (appClient) {
        appClient.emit("adi bot reserved slots", data);
      }

      if (adiBotUserClients[socket.username]) {
        adiBotUserClients[socket.username].emit("adi bot reserved slots", data);
      }
    }
  });

  socket.on("adi reserved new slot", (data) => {
    if (socket.username && adiBotClients[socket.username]) {
      if (appClient) {
        appClient.emit("adi reserved new slot", data);
      }

      if (adiBotUserClients[socket.username]) {
        adiBotUserClients[socket.username].emit("adi reserved new slot", data);
      }
    }
  });

  socket.on("message", (event, data) => {
    console.log(event, data);

    if (data && data.to) {
      if (adiBotClients[data.to]) {
        adiBotClients[data.to].emit(event, data);
      } else {
        socket.emit("failed", event, data);
      }
    } else {
      if (appClient) appClient.emit(event, data);

      if (socket.username && adiBotUserClients[socket.username]) {
        adiBotUserClients[socket.username].emit(event, data);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnected: ", socket.client.id);

    if (appClient && appClient.client.id === socket.client.id) {
      appClient = null;

      // let connectedAdiBots = Object.keys(adiBotClients);
      // let connectedAdiBotUsers = Object.keys(adiBotUserClients);
      // let connectedStudentBots = Object.keys(studentBotClients);
      // let connectedStudentBotUsers = Object.keys(studentBotUserClients);

      // for (let connectedAdiBot of connectedAdiBots) {
      //   adiBotClients[connectedAdiBot].emit("app disconnect");
      // }

      // for (let connectedAdiBotUser of connectedAdiBotUsers) {
      //   adiBotUserClients[connectedAdiBotUser].emit("app disconnect");
      // }

      // for (let connectedStudentBot of connectedStudentBots) {
      //   studentBotClients[connectedStudentBot].emit("app disconnect");
      // }

      // for (let connectedStudentBotUser of connectedStudentBotUsers) {
      //   studentBotUserClients[connectedStudentBotUser].emit("app disconnect");
      // }
    } else if (socket.username) {
      if (
        adiBotClients[socket.username] &&
        adiBotClients[socket.username].client.id === socket.client.id
      ) {
        if (appClient) {
          appClient.emit("adi bot disconnect", socket.username);
        }
        delete adiBotClients[socket.username];

        if (adiBotUserClients[socket.username]) {
          adiBotUserClients[socket.username].emit("adi bot reserved slots", []);
        }
      } else if (
        adiBotUserClients[socket.username] &&
        adiBotUserClients[socket.username].client.id === socket.client.id
      ) {
        if (appClient) {
          appClient.emit("adi client disconnect", socket.username);
        }

        delete adiBotUserClients[socket.username];
      }
    }
  });
});

app.set("port", 5000);

// Start server
server.listen(5000, () => {
  console.log("listening on *:5000");
});
