const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const workoutRouter = require("./routes/workouts");
const exerciseRouter = require("./routes/exercises");

mongoose.connect(process.env.MONGODB_URI).then(() => logger.info("connected to MondoDB"))
  .catch((error) => logger.error(`error connecting to MongoDB: ${error.message}`));

app.use(express.json());
app.use(cors());

app.use("/api/workouts", workoutRouter);
app.use("/api/exercises", exerciseRouter);

module.exports = app;
