const User = require("../models/User");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const CryptoJS = require("crypto-js");
const router = require("express").Router();
const logger = require("../middlewares/logger");
const { auditLog, getChanges } = require("../utils/auditLog");

//CHANGE PASSWORD
//send old pass and new pass
router.put("/changepassword", verifyTokenAndUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({
          error: "Korisnik koga menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC,
    );

    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    const inputPassword = req.body.oldpassword;

    if (originalPassword != inputPassword) {
      return res
        .status(404)
        .json({ error: "Pogrešna stara šifra!", code: "WRONG_OLD_PASSWORD" });
    }

    if (req.body.newpassword) {
      req.body.newpassword = CryptoJS.AES.encrypt(
        req.body.newpassword,
        process.env.PASS_SEC,
      ).toString();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { password: req.body.newpassword },
      },
      { new: true },
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({
          error: "Korisnik koga menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }

    //avoid sending password back, even hashed one
    const { password, ...others } = updatedUser._doc;
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "UPDATE",
      resource: "User",
      resourceId: updatedUser._id,
      resourceName: updatedUser.username,
      endpoint: req.originalUrl,
      status: 200,
      changes: { password: { old: "***", new: "***" } },
    });
    return res.status(200).json({ ...others });
  } catch (err) {
    logger.error("Error change user password:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri menjanju šifre korisnika.",
        code: "GENERIC_ERROR",
      });
  }
});

//UPDATE prava korisnika
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const oldUser = await User.findById(req.params.id);
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isAdmin: req.body.isAdmin },
      },
      { new: true },
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({
          error: "Korisnik koga menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "UPDATE",
      resource: "User",
      resourceId: updatedUser._id,
      resourceName: updatedUser.username,
      endpoint: req.originalUrl,
      status: 200,
      changes: oldUser ? getChanges(oldUser, updatedUser) : undefined,
    });
    return res.status(200).json(updatedUser);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.username) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Korisničko ime postoji. Korisničko ime mora biti jedinstveno!",
          code: "USERNAME_DUPLICATE",
        });
    } else {
      logger.error("Error edit user:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene korisnika.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({
          error: "Korisnik koga brišete nije pronadjen.",
          code: "NOT_FOUND",
        });
    }
    logger.info(
      `Deleted user: ${deletedUser.username}, with id: ${deletedUser._id}`,
    );
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "DELETE",
      resource: "User",
      resourceId: deletedUser._id,
      resourceName: deletedUser.username,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json("User has been deleted.");
  } catch (err) {
    logger.error("Error delete user:", err);
    return res
      .status(500)
      .json({ error: "Greška pri brisanju korisnika.", code: "GENERIC_ERROR" });
  }
});

//GET
router.get("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Korisnik nije pronađen.", code: "NOT_FOUND" });
    }
    const { password, ...others } = user._doc;
    return res.status(200).json(others);
  } catch (err) {
    logger.error("Error get user:", err);
    return res
      .status(500)
      .json({ error: "Greška pri traženju korisnika.", code: "GENERIC_ERROR" });
  }
});

//GET ALL
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    let users;
    users = await User.find().sort({ createdAt: -1 });
    users = users.filter((user) => user.username !== "superadmin");
    return res.status(200).json(users);
  } catch (err) {
    logger.error("Error get all users:", err);
    return res
      .status(500)
      .json({ error: "Greška pri traženju korisnika.", code: "GENERIC_ERROR" });
  }
});

module.exports = router;
