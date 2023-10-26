const { createSecretToken } = require("../config/SecretToken");
const Client = require("../models/adiClient");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await Client.findOne({ username });

    if (!client) {
      return res.status(400).json({ error: "This username doesn't exist" });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const token = createSecretToken({ username });

    res.json({ message: "success", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || username === "" || password === "") {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingClient = await Client.findOne({ username });
    if (existingClient) {
      return res.status(400).json({ error: "Client already exists" });
    }

    const client = await Client.create({ username, password });

    res.json({ message: "success", client });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json({ message: "success", clients });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { login, register, getClients };
