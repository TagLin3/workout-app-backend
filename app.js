const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("express-async-errors");
const morgan = require("morgan");
const logger = require("./utils/logger");
const routineRouter = require("./routes/routines");
const exerciseRouter = require("./routes/exercises");
const setRouter = require("./routes/sets");
const workoutRouter = require("./routes/workouts");
const userRouter = require("./routes/users");
const loginRouter = require("./routes/login");
const { errorHandler } = require("./utils/middleware");

mongoose.connect(process.env.MONGODB_URI).then(() => logger.info("connected to MondoDB"))
  .catch((error) => logger.error(`error connecting to MongoDB: ${error.message}`));

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

app.use("/api/routines", routineRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/sets", setRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);

app.use(errorHandler);

module.exports = app;
