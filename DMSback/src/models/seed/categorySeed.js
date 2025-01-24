const Category = require("../Category");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new Category({
    name: "kategorija1",
    label: "k1",
  }),
  new Category({
    name: "kategorija2",
    label: "k2",
  }),
  new Category({
    name: "kategorija3",
    label: "k3",
  }),
  new Category({
    name: "kategorija4",
    label: "k4",
  }),
  new Category({
    name: "kategorija5",
    label: "k5",
  }),
  new Category({
    name: "kategorija6",
    label: "k6",
  }),
  new Category({
    name: "kategorija7",
    label: "k7",
  }),
  new Category({
    name: "kategorija8",
    label: "k8",
  }),
  new Category({
    name: "kategorija9",
    label: "k9",
  }),
  new Category({
    name: "kategorija10",
    label: "k10",
  }),
  new Category({
    name: "kategorija11",
    label: "k11",
  }),
  new Category({
    name: "kategorija12",
    label: "k12",
  }),
  new Category({
    name: "kategorija13",
    label: "k13",
  }),
  new Category({
    name: "kategorija14",
    label: "k14",
  }),
  new Category({
    name: "kategorija15",
    label: "k15",
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
