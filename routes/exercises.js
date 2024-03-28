const exerciseRouter = require("express").Router();
const Exercise = require("../models/exercise");

exerciseRouter.get("/", async (req, res) => {
  const exercises = await Exercise.find({ $or: [{ user: req.user.id }, { user: undefined }] });
  return res.json(exercises);
});

exerciseRouter.post("/", async (req, res) => {
  const exercise = new Exercise({
    name: req.body.name,
    user: req.user.id,
  });
  const savedExercise = await exercise.save();
  return res.status(201).json(savedExercise);
});

module.exports = exerciseRouter;
