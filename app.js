const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("express-async-errors");
const morgan = require("morgan");
const path = require("path");
const logger = require("./utils/logger");
const routineRouter = require("./routes/routines");
const exerciseRouter = require("./routes/exercises");
const setRouter = require("./routes/sets");
const workoutRouter = require("./routes/workouts");
const userRouter = require("./routes/users");
const loginRouter = require("./routes/login");
const { errorHandler, authorizer } = require("./utils/middleware");

if (process.env.NODE_ENV === "development") {
  mongoose.connect(process.env.MONGODB_URI).then(() => logger.info("connected to MondoDB"))
    .catch((error) => logger.error(`error connecting to MongoDB: ${error.message}`));
}

if (process.env.NODE_ENV === "production") {
  mongoose.connect(process.env.MONGODB_URI_PROD).then(() => logger.info("connected to MondoDB"))
    .catch((error) => logger.error(`error connecting to MongoDB: ${error.message}`));
}

app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("tiny"));
}
app.use(authorizer);

app.use("/api/routines", routineRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/sets", setRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);
app.use("*", (req, res) => {
  if (req.baseUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  if (req.baseUrl.startsWith("/assets/")) {
    const fileName = req.baseUrl.slice(8);
    return res.sendFile(path.join(__dirname, "./dist/assets/", fileName));
  }
  return res.sendFile(path.join(__dirname, "./dist", "index.html"));
});

app.use(errorHandler);

module.exports = app;
