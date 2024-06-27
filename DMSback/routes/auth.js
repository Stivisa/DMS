const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/verifyToken");
const CustomError = require("../utils/CustomError");
const logger = require("../middlewares/logger");
//REGISTER
router.post("/register", verifyToken, async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC,
    ).toString(),
  });
  try {
    //throw new Error("Test genericke greske");
    const savedUser = await newUser.save(); //vraca error ako ne uspe snimanje, ako uspe vrati objekat snimljeni
    //avoid sending password back, even hashed one
    const { password, ...others } = savedUser._doc;
    res.status(200).json(others);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.username) { // MongoDB duplicate key error
        res.status(400).json({ error: "Korisničko ime postoji. Korisničko ime mora biti jedinstveno!", code: "USERNAME_DUPLICATE" });
    } else{
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error register user:", err)
      res.status(500).json({ error: "Došlo je do greške prilikom registracije korisnika.", code: "GENERIC_ERROR" });
    }
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.body.username,
    });
    if (!user) {
      throw new CustomError("Pogrešno korisničko ime", "INVALID_USERNAME");
    }
    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC,
    );
    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
    const inputPassword = req.body.password;
    if (originalPassword !== inputPassword) {
      throw new CustomError("Pogrešna šifra", "INVALID_PASSWORD");
    }
    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        superAdmin: user.superAdmin,
      },
      process.env.JWT_SEC,
      { expiresIn: "12h" },
    );
    //avoid sending password back, even hashed one
    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    if (err.code && err.message) {
      res.status(400).json({ error: err.message, code: err.code });
    } else {
      logger.error("Error login user:", err)
      res.status(500).json({ error: "Došlo je do greške prilikom prijavljivanja korisnika.", code: "GENERIC_ERROR" });
    }
  }
});

module.exports = router;
