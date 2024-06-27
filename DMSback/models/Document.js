const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const DocumentBase = require("./DocumentBase");

const DocumentSchema = new mongoose.Schema(
  DocumentBase.obj,
  { timestamps: true }, //createdAt, updatedAt time/date
);

DocumentSchema.plugin(AutoIncrement, {
  id: "serialNumber",
  inc_field: "serialNumber",
  reference_fields: ["category"],
  start_seq: 0,
  collection_name: 'counter_documents', // Specify the collection name
});

module.exports = mongoose.model("Document", DocumentSchema);
