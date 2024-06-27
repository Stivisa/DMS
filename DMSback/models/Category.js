const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    //predefinisana zakonom
    //mozda i nije potrebna strana za kategorije ili strana za admina
    name: { type: String, required: true, unique: true },
    label: { type: String, required: true, unique: true },
    keepPeriod: { type: Number },
  },
  { timestamps: true, collection: "categories" }, //CreatedAt and UpdatedAt times
);

module.exports = mongoose.model("Category", CategorySchema);
