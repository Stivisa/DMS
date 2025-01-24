const { createLogger, transports, format } = require("winston");
require("winston-mongodb");
const dotenv = require("dotenv");

dotenv.config();

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "logs.log",
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    /*
    new transports.MongoDB({
      db: process.env.MONGO_LOCAL_URL_LOGS,
      collection: "logs",
      options: {
        useUnifiedTopology: true,
      },
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    */
  ],
});

module.exports = logger;
