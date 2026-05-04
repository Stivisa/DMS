const mongoose = require("mongoose");
const Location = require("../Location");

const seedLocations = async () => {
  const count = await Location.countDocuments();
  if (count > 0) return; // already seeded, skip

  // Find all firma_* document collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  const firmaCollections = collections.filter((c) =>
    c.name.startsWith("firma_"),
  );

  const locationSet = new Set();
  for (const col of firmaCollections) {
    const docs = await mongoose.connection.db
      .collection(col.name)
      .find(
        { physicalLocation: { $exists: true, $ne: null, $ne: "" } },
        { projection: { physicalLocation: 1 } },
      )
      .toArray();

    docs.forEach((doc) => {
      if (doc.physicalLocation && doc.physicalLocation.trim()) {
        locationSet.add(doc.physicalLocation.trim());
      }
    });
  }

  if (locationSet.size > 0) {
    const locationDocs = Array.from(locationSet).map((name) => ({ name }));
    await Location.insertMany(locationDocs, { ordered: false });
  }
};

module.exports = { seedLocations };
