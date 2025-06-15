const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    //predefinisana zakonom?
    //izgleda da svaka firma propisuje za sebe a ne zakonom zajednicka za sve
    //mozda i nije potrebna strana za kategorije ili strana za admina
    name: { type: String, required: true, unique: true },
    //oznaka po primerima je opciona, ako je nema onda prikazuju redniBroj
    label: { type: String },
    serialNumber: { type: Number, unique: true },
    keepYears: { type: Number },
    keepMonths: { type: Number },
  },
  { timestamps: true, collection: "categories" }, //CreatedAt and UpdatedAt times
);

module.exports = mongoose.model("Category", CategorySchema);
