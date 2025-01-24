const mongoose = require("mongoose");
const DocumentBase = require("./DocumentBase");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const createDocumentDuplicateModel = async (duplicateCollectionName) => {

  //kljucno jer pri praznoj db, model se kreira i mongooose ga vidi. 
  //Pri sledecem pokretanju kolekcije vec postoje i model se ne kreira, pa ga mongoose ni ne kreira.
  //Ovako ako postoji vrati postojeci ako ne kreiraj, pa model  uvek postoji.
  if (mongoose.models[duplicateCollectionName]) {
    //console.log(`Model ${duplicateCollectionName} already exists`);
    return mongoose.models[duplicateCollectionName];
  }

  const DuplicateDocumentSchema = new mongoose.Schema(
    DocumentBase.obj,
    { timestamps: true, collection: duplicateCollectionName },
  );
  
  DuplicateDocumentSchema.plugin(AutoIncrement, {
    id: duplicateCollectionName,
    inc_field: "serialNumber",
    reference_fields: ["category"],
    start_seq: 1,
    collection_name: 'counters_' + duplicateCollectionName,
  });
  
  // Middleware to handle updates via findOneAndUpdate
  DuplicateDocumentSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();

    if (update.$set && update.$set.category) {
        const categoryId = new mongoose.Types.ObjectId(update.$set.category);

        // Fetch the new serial number for the new category
        const newSerialDoc = await mongoose.connection.collection('counters_' + duplicateCollectionName)
            .findOneAndUpdate(
                { "reference_value.category":categoryId, id: duplicateCollectionName },  // Query by category ObjectId
                { $inc: { seq: 1 } },
                { returnOriginal: false, upsert: true }
            );
        
        if (newSerialDoc) {
            // Modify the update object to include the new serialNumber
            update.$set.serialNumber = newSerialDoc.seq;
            this.setUpdate(update);
        }
    }
    next();
  });
  
  
  const DuplicateDocument  = mongoose.model(duplicateCollectionName, DuplicateDocumentSchema);

  /*
  try {
    const elements = await DuplicateDocument.countDocuments();
    if (!elements) {
      DuplicateDocument.create({
        name: 'Initial Document Name',
      });
      //console.log(`Document added to ${duplicateCollectionName} collection`);
    }
  } catch (error) {
    console.error(`Error seeding ${duplicateCollectionName} collection:`, error);
  }
  */

  return DuplicateDocument;
}

module.exports = {createDocumentDuplicateModel};