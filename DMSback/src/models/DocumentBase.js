const mongoose = require("mongoose");

const DocumentBaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    //auto-increment za svaku kategoriju posebno, ne moze biti unique
    serialNumber: { type: Number, unique: false },
    //mogucnost pretrazivanje i po opisu
    description: { type: String },
    //lokacija fizickog dokumenta ako je negde odstampan
    physicalLocation: { type: String },
    //kolicna u jedinicama cuvanja (ako nije unet fajl onda u MB)
    quantity: { type: String }, 
    //sadrzaj
    content: { type: String },
    //nije vidljiva korisniku i folder glavni tipa DMS treba biti skriven/zakljucan tj dostupan samo preko app
    //sa default: null, nije radilo kad unosim novi dokument bez fajla
    filePath: { type: String, unique: true, sparse: true},
    isFolder: {
      type: Boolean
    },
    //velicina fajla, prikazuje u arhivskoj knjizi
    fileSize: { type: String },
    //kategorija jedna, opseg svih ce biti propisan
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    //ranga slicnog kategorije, korisnici mogu kreirati sopstvene tagove za kasnije pretrazivanje
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    //nastanak dokumenta i datum isteka perioda cuvanja, ako je istekao expired true
    originDate : { type: Date, required: true },
    keepDate : { type: Date},
    expired: { type: Boolean, default: false },
    //godina za koju vazi dokument, isto zbog pretrage (oni sad skeniraju raniji dokument pa nije dovoljno datum kreiranja)
    yearStart: { type: Number },
    yearEnd: { type: Number },
    /*
    yearStart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Year",
    },
    */
    //za kog komitenta/kompaniju je dokument vezan (moze biti spoljasnji ili neki interni tipa magacin1)
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    //obrisani dokument se premesta u interni recycle bin folder, i brise se nakon odredjenog vremena ili kad dostigne odredjenu velicinu fajl
    recyclePath: { type: String },
    //odgovara vremenu createdAt
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    //odgovara vremenu updatedAt
    lastUpdatedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
);

module.exports = DocumentBaseSchema;
