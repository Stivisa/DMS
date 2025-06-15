const mongoose = require("mongoose");

const DocumentBaseSchema = new mongoose.Schema({
  //obrisao required: true jer ne treba biti ako ne otpremas fajl
  //upitna svrha polja, jer ne koristi za imenovanje fajla, niti pri update za rename fajla...
  /*
  sparse index is a type of index that only includes documents that have the indexed field.
  In a normal index, every document in the collection is included in the index, 
  even if the document doesn't have the indexed field. 
  */
  name: { type: String, unique: true, sparse: true },
  //auto-increment za svaku kategoriju posebno, ne moze biti unique
  //u primerima samo uvecavaju, unique
  serialNumber: { type: Number, unique: true },
  //mogucnost pretrazivanje i po opisu
  description: { type: String },
  //lokacija fizickog dokumenta ako je negde odstampan
  physicalLocation: { type: String },
  //kolicna u jedinicama cuvanja (ako nije unet fajl onda u MB)
  quantity: { type: String },
  //sadrzaj
  content: { type: String },
  note: { type: String },
  //nije vidljiva korisniku i folder glavni tipa DMS treba biti skriven/zakljucan tj dostupan samo preko app
  //sa default: null, nije radilo kad unosim novi dokument bez fajla
  filePath: { type: String, unique: true, sparse: true },
  isFolder: {
    type: Boolean,
  },
  //velicina fajla, prikazuje u arhivskoj knjizi
  fileSize: { type: String },
  //kategorija moze biti vise po primerima, opseg svih ce biti propisan
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  //ranga slicnog kategorije, korisnici mogu kreirati sopstvene tagove za kasnije pretrazivanje
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  //nastanak dokumenta i datum isteka perioda cuvanja, ako je istekao expired true
  originDate: { type: Date, required: true },
  keepDate: { type: Date },
  expired: { type: Boolean, default: false },
  //godina za koju vazi dokument, isto zbog pretrage (oni sad skeniraju raniji dokument pa nije dovoljno datum kreiranja)
  yearStart: { type: Number },
  yearEnd: { type: Number },
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
});

module.exports = DocumentBaseSchema;
