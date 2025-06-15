const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    value: { type: String },
    valueObject: { type: Object },
  },
  { timestamps: true }, //CreatedAt and UpdatedAt times
);

module.exports = mongoose.model("Setting", SettingSchema);
