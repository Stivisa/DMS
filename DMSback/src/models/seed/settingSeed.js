const Setting = require("../Setting");

const seedData = [
  new Setting({
    name: "brojSaglasnosti",
    value: "",
  }),
];

const seedSettings = async () => {
  const elements = await Setting.countDocuments();
  if (!elements) {
    await Setting.insertMany(seedData);
  }
};

module.exports = {
  seedSettings,
};
