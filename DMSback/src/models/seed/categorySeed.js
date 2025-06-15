const Category = require("../Category");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new Category({
    name: "kategorija1",
    label: "k1",
    keepYears: 5,
    serialNumber: 1,
  }),
  new Category({
    name: "kategorija2",
    label: "k2",
    keepMonths: 3,
    serialNumber: 2,
  }),
  new Category({
    name: "kategorija3",
    label: "k3",
    keepYears: 10,
    keepMonths: 2,
    serialNumber: 3,
  }),
];

const seedCategories = async () => {
  //await User.deleteMany({});
  const elements = await Category.countDocuments();
  if (!elements) {
    await Category.insertMany(seedData);
  }
};

module.exports = {
  seedCategories,
};
