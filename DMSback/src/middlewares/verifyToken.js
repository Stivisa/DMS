const jwt = require("jsonwebtoken");
const logger = require("./logger");
const TokenExpiredError = require("jsonwebtoken").TokenExpiredError;

const verifyToken = (req, res, next) => {
  //console.log(req.headers);
  const authHeader = req.headers.authorization;
  const companyName = req.headers?.companyname;
  const companyId = req.headers?.companyid;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err instanceof TokenExpiredError) {
        res.status(511).json("Prijava je istekla!");
        return;
      }
      //login token contains user id,isAdmin,superAdmin
      req.user = user;
      if (req.method != "GET") {
        logger.info(
          "User: " +
            req.user.username +
            "(" +
            req.user.id +  ")" +
            ' Company: ' + companyName + '(' + companyId + ')' +
            ". Action: " +
            req.method +
            " " +
            req.get("host") +
            " " +
            req.originalUrl,
        );
      }
      next();
    });
  } else {
    res.status(401).json("You are not authenticated!");
  }
};

const verifyTokenAndUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.id) {
      next();
    } else {
      res.status(403).json("You are not user!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.isAdmin) {
      next();
    } else {
      res.status(403).json("You are not admin!");
    }
  });
};

const verifyTokenAndSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.isAdmin && req.user?.superAdmin) {
      next();
    } else {
      res.status(403).json("You are not super admin!");
    }
  });
};

//for routes that contain userid. Must match with token id. So user can see just his order...
const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You are not alowed to do that!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndUser,
  verifyTokenAndSuperAdmin,
};
