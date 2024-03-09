const express = require("express");
const app = express();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const workoutRouter = require("./routes/workouts");

mongoose.connect(process.env.MONGODB_URI).then(() => logger.info("connected to MondoDB"))
  .catch((error) => logger.error(`error connecting to MongoDB: ${error.message}`));

app.use(express.json());

app.use("/api/workouts", workoutRouter);

module.exports = app;
