const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    // internal: { type: Boolean, default: false,},
  },
  { timestamps: true },
);

module.exports = mongoose.model("Client", ClientSchema);
