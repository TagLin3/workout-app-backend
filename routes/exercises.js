const exerciseRouter = require("express").Router();
const Exercise = require("../models/exercise");

exerciseRouter.get("/", async (req, res) => {
  const exercises = await Exercise.find({});
  return res.json(exercises);
});

exerciseRouter.post("/", async (req, res) => {
  const exercise = new Exercise(req.body);
  const savedExercise = await exercise.save();
  return res.status(201).json(savedExercise);
});

module.exports = exerciseRouter;
