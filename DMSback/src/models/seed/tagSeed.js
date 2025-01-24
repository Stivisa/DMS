const Tag = require("../Tag");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new Tag({
    name: "tag1",
  }),
  new Tag({
    name: "tag2",
  }),
  new Tag({
    name: "tag3",
  }),
  new Tag({
    name: "tag4",
  }),
  new Tag({
    name: "tag5",
  }),
  new Tag({
    name: "tag6",
  }),
  new Tag({
    name: "tag7",
  }),
  new Tag({
    name: "tag8",
  }),
  new Tag({
    name: "tag9",
  }),
  new Tag({
    name: "tag10",
  }),
  new Tag({
    name: "tag11",
  }),
  new Tag({
    name: "tag12",
  }),
  new Tag({
    name: "tag13",
  }),
  new Tag({
    name: "tag14",
  }),
  new Tag({
    name: "tag15",
  }),
];

const seedTags = async () => {
  //await User.deleteMany({});
  const elements = await Tag.countDocuments();
  if (!elements) {
    await Tag.insertMany(seedData);
  }
};

module.exports = {
  seedTags,
};
