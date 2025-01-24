const Document = require("../Document");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new Document({
    name: "document1",
  }),
  new Document({
    name: "document2",
    isDeleted: true,
  }),
  new Document({
    name: "document3",
  }),
  new Document({
    name: "document4",
  }),
  new Document({
    name: "document5",
  }),
  new Document({
    name: "document6",
  }),
  new Document({
    name: "document7",
  }),
  new Document({
    name: "document8",
  }),
  new Document({
    name: "document9",
  }),
  new Document({
    name: "document10",
  }),
  new Document({
    name: "document20",
  }),
  new Document({
    name: "document30",
  }),
  new Document({
    name: "document40",
  }),
  new Document({
    name: "document50",
  }),
  new Document({
    name: "document60",
  }),
  new Document({
    name: "document70",
  }),
  new Document({
    name: "document80",
  }),
  new Document({
    name: "document90",
  }),
  new Document({
    name: "document101",
  }),
  new Document({
    name: "document201",
  }),
  new Document({
    name: "document301",
  }),
  new Document({
    name: "document401",
  }),
  new Document({
    name: "document501",
  }),
  new Document({
    name: "document601",
  }),
  new Document({
    name: "document701",
  }),
  new Document({
    name: "document801",
  }),
  new Document({
    name: "document901",
  }),
];

const seedDocuments = async () => {
  //await User.deleteMany({});
  const elements = await Document.countDocuments();
  if (!elements) {
    await Document.insertMany(seedData);
  }
};

module.exports = {
  seedDocuments,
};
