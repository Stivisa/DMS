const express = require("express");
const app = express();
const mongoose = require("mongoose");
const logger = require("./middlewares/logger");
const { setDmsFolderPath, initStorage } = require("./utils/storage");
const dotenv = require("dotenv");

const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const clientRoute = require("./routes/client");
const tagRoute = require("./routes/tag");
const categoryRoute = require("./routes/category");
const settingRoute = require("./routes/setting");
const companyRoute = require("./routes/company");
const documentDynamicRoute = require("./routes/documentDynamic").router;
const documentDynamicPublicRoute = require("./routes/documentDynamic").publicRouter;

const cors = require("cors");
const http = require("http");

const { seedUsers } = require("./models/seed/userSeed");
const { seedClients } = require("./models/seed/clientSeed");
const { seedTags } = require("./models/seed/tagSeed");
const { seedCategories } = require("./models/seed/categorySeed");
const { seedSettings } = require("./models/seed/settingSeed");
const { seedCompanies } = require("./models/seed/companySeed");

dotenv.config();

mongoose
  .connect(process.env.MONGO_LOCAL_URL, {})
  .then(() => logger.info("Database connected"))
  .catch((err) => logger.error("Error connecting to database:", err));

const port = process.env.PORT || 5001;

let corsOptions = {
  //origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "DELETE", "PUT"],
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.json({ limit: "100mb" }));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/document/preview", documentDynamicPublicRoute);
app.use("/api/document", documentDynamicRoute);

app.use("/api/clients", clientRoute);
app.use("/api/tags", tagRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/settings", settingRoute);
app.use("/api/companies", companyRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.send("RADI");
});

const server = http.createServer(app);

const seedDb = () => {
  try {
    // Seeding data
    //mandatory
    seedUsers();
    seedSettings();
    //testing
    //seedTags();
    //seedCategories();
    //seedClients();
    //seedCompanies();
  } catch (err) {
    logger.error("Error seeding database", err);
  }
};
seedDb();

try {
  setDmsFolderPath(process.env.DISK);
} catch (err) {
  logger.error(err.toString());
}

server.listen(port, () => {
  console.log("Server is running on port " + port + "!");
  logger.info("Server is running on port " + port + "!");
});
