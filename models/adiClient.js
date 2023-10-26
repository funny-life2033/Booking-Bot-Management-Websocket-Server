const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");

const AdiClientSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, "This username is already used."],
  },
  password: {
    type: String,
    required: true,
  },
});

AdiClientSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

const AdiClient = mongoose.model("AdiClient", AdiClientSchema);

module.exports = AdiClient;
