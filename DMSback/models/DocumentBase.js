const mongoose = require("mongoose");

const DocumentBaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    //auto-increment za svaku kategoriju posebno, ne moze biti unique
    serialNumber: { type: Number, unique: false },
    //mogucnost pretrazivanje i po opisu
    description: { type: String },
    //sadrzaj
    physicalLocation: { type: String },
    //lokacija fizickog dokumenta ako je negde odstampan
    content: { type: String },
    //nije vidljiva korisniku i folder glavni tipa DMS treba biti skriven/zakljucan tj dostupan samo preko app
    filePath: { type: String, unique: true },
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
    //godina za koju vazi dokument, isto zbog pretrage (oni sad skeniraju raniji dokument pa nije dovoljno datum kreiranja)
    //nekako ograniciti da biraju iz liste godine od tipa 2000
    yearStart: { type: Number },
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
