// const express = require("express");
// const app = express();
// const http = require("http");
// const WebSocket = require("ws");
// const cors = require("cors");

// const server = http.createServer(app);

// const WebSocketServer = new WebSocket.Server({ server });

// let botClients = {};
// WebSocketServer.on("connection", (ws) => {
//   console.log("new connection from ", ws.url);
//   ws.send("connected to server");
//   ws.on("message", function incoming(message, isBinary) {
//     const msg = message.toString();
//     // WebSocketServer.clients.forEach(function each(client) {
//     //   if (client.readyState === WebSocket.OPEN) {
//     //     client.send(message.toString());
//     //   }
//     // });
//     const msgArr = msg.split("--");
//     if (msgArr[0] === "bot" && !botClients[msgArr[1]]) {
//       botClients[msgArr[1]] = { ws };
//       console.log("increased to: ", botClients);
//       ws.send("connected to server");
//     } else if (msgArr[0] === "app") {
//       if (botClients[msgArr[1]]) {
//         if (botClients[msgArr[1]]["app"]) {
//           ws.send("failed--The device is already connected to other app");
//         } else {
//           botClients[msgArr[1]]["app"] = ws;
//           ws.send("success");
//           botClients[msgArr[1]]["ws"].send("connect");
//         }
//       } else {
//         ws.send("failed--The device doesn't exist");
//       }
//     }
//   });

//   const closeHandle = () => {
//     for (let key of Object.keys(botClients)) {
//       if (botClients[key]["ws"] === ws) {
//         botClients[key]["app"]?.send("disconnect");
//         delete botClients[key];
//         break;
//       } else if (botClients[key]["app"] === ws) {
//         botClients[key]["app"] = null;
//         botClients[key]["ws"].send("disconnect");
//         break;
//       }
//     }
//     console.log("reduced to: ", botClients);
//   };

//   ws.on("close", closeHandle);

//   ws.on("error", closeHandle);
// });

// app.use(
//   cors({
//     origin: "*",
//     optionsSuccessStatus: 200,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// server.listen(5000, "0.0.0.0", () => {
//   console.log("Listening to port 5000");
// });

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
    credentials: true,
  },
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

let users = {};

io.on("connection", (socket) => {
  const { id } = socket.client;
  console.log(`new client session: ${id}`);

  socket.on("disconnect", (e) => {
    console.log("disconnected: ", e);
  });

  socket.on("app login", (user) => {
    console.log(`user connected: ${user.username}`);

    const sameUser = users[user.username];

    if (!sameUser) {
      socket.username = user.username;
      users[user.username] = { app: socket };
      socket.emit("user login success", user);
    } else {
      if (sameUser.app) {
        socket.emit("user login failed", "The username is already existed");
      } else if (sameUser.password !== user.password) {
        socket.emit("user login failed", "Wrong Password");
      } else {
        socket.username = user.username;
        users[user.username].app = socket;
        socket.emit("user login success", user);
        if (users[user.username].adiBot)
          users[user.username].adiBot.emit("app connected", user);
        if (users[user.username].studentBot)
          users[user.username].studentBot.emit("app connected", user);
      }
    }
  });

  socket.on("adi bot login", (user) => {
    console.log(`user connected: ${user.username}`);

    const sameUser = users[user.username];

    if (!sameUser) {
      socket.username = user.username;
      users[user.username] = { adiBot: socket };
      socket.emit("user login success", user);
    } else {
      if (sameUser.adiBot) {
        socket.emit("user login failed", "The username is already existed");
      } else if (sameUser.password !== user.password) {
        socket.emit("user login failed", "Wrong Password");
      } else {
        socket.username = user.username;
        users[user.username].adiBot = socket;
        socket.emit("user login success", user);
        if (users[user.username].app)
          users[user.username].app.emit("adi bot connected", user);
      }
    }
  });

  socket.on("student bot login", (user) => {
    console.log(`user connected: ${user.username}`);

    const sameUser = users[user.username];

    if (!sameUser) {
      socket.username = user.username;
      users[user.username] = { studentBot: socket };
      socket.emit("user login success", user);
    } else {
      if (sameUser.studentBot) {
        socket.emit("user login failed", "The username is already existed");
      } else if (sameUser.password !== user.password) {
        socket.emit("user login failed", "Wrong Password");
      } else {
        socket.username = user.username;
        users[user.username].studentBot = socket;
        socket.emit("user login success", user);
        if (users[user.username].app)
          users[user.username].app.emit("student bot connected", user);
      }
    }
  });

  socket.on("adi bot start", () => {
    if (users[socket.username].app === socket) {
      if (users[socket.username].adiBot) {
        users[socket.username].adiBot.emit("adi bot start");
      }
    }
  });

  socket.on("adi bot started", () => {
    if (users[socket.username].adiBot === socket) {
      if (users[socket.username].app) {
        users[socket.username].app.emit('"adi bot started');
      }
    }
  });

  socket.on("adi bot stop", () => {
    if (users[socket.username].app === socket) {
      if (users[socket.username].adiBot) {
        users[socket.username].adiBot.emit("adi bot stop");
      }
    }
  });

  socket.on("adi bot stopped", () => {
    if (users[socket.username].adiBot === socket) {
      if (users[socket.username].app) {
        users[socket.username].app.emit('"adi bot stopped');
      }
    }
  });

  socket.on("adi accept slot", (slot) => {
    if (users[socket.username].app === socket) {
      if (users[socket.username].adiBot) {
        users[socket.username].adiBot.emit("adi accept slot", slot);
      }
    }
  });

  socket.on("adi accepted slot", (slot) => {
    if (users[socket.username].adiBot === socket) {
      if (users[socket.username].bot) {
        users[socket.username].bot.emit("adi accepted slot", slot);
      }
    }
  });

  socket.on("adi decline slot", (slot) => {
    if (users[socket.username].app === socket) {
      if (users[socket.username].adiBot) {
        users[socket.username].adiBot.emit("adi decline slot", slot);
      }
    }
  });

  socket.on("adi declined slot", (slot) => {
    if (users[socket.username].adiBot === socket) {
      if (users[socket.username].bot) {
        users[socket.username].bot.emit("adi declined slot", slot);
      }
    }
  });

  socket.on("reserved new slot", (slots) => {
    if (users[socket.username].adiBot === socket) {
      if (users[socket.username].bot) {
        users[socket.username].bot.emit("reserved new slot", slots);
      }
    }
  });

  socket.on("disconnect", () => {
    if (users[socket.username].app === socket) {
      if (users[socket.username].adiBot || users[socket.username].studentBot) {
        delete users[socket.username].app;
        if (users[socket.username].adiBot)
          users[socket.username].adiBot.emit("app disconnected");
        if (users[socket.username].studentBot)
          users[socket.username].studentBot.emit("app disconnected");
      } else {
        delete users[socket.username];
      }
    } else if (users[socket.username].adiBot === socket) {
      if (users[socket.username].app) {
        delete users[socket.username].adiBot;
        users[socket.username].app.emit("adi bot disconnected");
      } else {
        delete users[socket.username];
      }
    } else if (users[socket.username].studentBot === socket) {
      if (users[socket.username].app) {
        delete users[socket.username].studentBot;
        users[socket.username].app.emit("student bot disconnected");
      } else {
        delete users[socket.username];
      }
    }
  });
});

app.set("port", 5000);

// Start server
server.listen(5000, () => {
  console.log("listening on *:5000");
});
