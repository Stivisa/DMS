const User = require("../User");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new User({
    username: "vilazubor",
    password: CryptoJS.AES.encrypt("vilazubor2022", process.env.PASS_SEC).toString(),
    isAdmin: true,
    superAdmin: true,
  }),
  new User({
    username: "admin",
    password: CryptoJS.AES.encrypt("admin", process.env.PASS_SEC).toString(),
    isAdmin: true,
  }),
  new User({
    username: "user1",
    password: CryptoJS.AES.encrypt("user1", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user2",
    password: CryptoJS.AES.encrypt("user2", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user3",
    password: CryptoJS.AES.encrypt("user3", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user4",
    password: CryptoJS.AES.encrypt("user4", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user5",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user6",
    password: CryptoJS.AES.encrypt("user6", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user7",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user8",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user9",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user10",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user11",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user12",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user13",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user14",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  new User({
    username: "user15",
    password: CryptoJS.AES.encrypt("user5", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
];

const seedUsers = async () => {
  //await User.deleteMany({});
  const elements = await User.countDocuments();
  if (!elements) {
    await User.insertMany(seedData);
    /*
    seedData.map(async (user) => {
      await user.save();
    });
    */
  }
};

module.exports = {
  seedUsers,
};
