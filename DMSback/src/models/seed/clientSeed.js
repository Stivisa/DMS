const Client = require("../Client");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new Client({
    name: "client1",
  }),
  new Client({
    name: "client2",
    //internal: true,
  }),
  new Client({
    name: "client3",
  }),
  new Client({
    name: "client4",
  }),
  new Client({
    name: "client5",
  }),
  new Client({
    name: "client6",
  }),
  new Client({
    name: "client7",
  }),
  new Client({
    name: "client8",
  }),
  new Client({
    name: "client9",
  }),
  new Client({
    name: "client10",
  }),
  new Client({
    name: "client11",
  }),
  new Client({
    name: "client12",
  }),
  new Client({
    name: "client13",
  }),
  new Client({
    name: "client14",
  }),
  new Client({
    name: "client15",
  }),
];

const seedClients = async () => {
  //await User.deleteMany({});
  const elements = await Client.countDocuments();
  if (!elements) {
    await Client.insertMany(seedData);
  }
};

module.exports = {
  seedClients,
};
