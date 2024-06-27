const mongoose = require("mongoose");

const YearSchema = new mongoose.Schema(
  {
    //predefinisana zakonom
    //mozda i nije potrebna strana za kategorije ili strana za admina
    value: { type: Number, required: true, unique: true },
  },
  { timestamps: true }, //CreatedAt and UpdatedAt times
);

module.exports = mongoose.model("Year", YearSchema);
