const User = require("../User");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");

dotenv.config();

const seedData = [
  new User({
    username: "superadmin",
    password: CryptoJS.AES.encrypt(
      "adminsuper",
      process.env.PASS_SEC,
    ).toString(),
    isAdmin: true,
    superAdmin: true,
  }),
  new User({
    username: "admin",
    password: CryptoJS.AES.encrypt("admin", process.env.PASS_SEC).toString(),
    isAdmin: true,
  }),
  /*
  new User({
    username: "user1",
    password: CryptoJS.AES.encrypt("user1", process.env.PASS_SEC).toString(),
    isAdmin: false,
  }),
  */
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
