const exerciseRouter = require("express").Router();
const Exercise = require("../models/exercise");

exerciseRouter.get("/", async (req, res) => {
  const exercises = await Exercise.find({});
  return res.json(exercises);
});

exerciseRouter.post("/", async (req, res) => {
  if (!req.body.name) {
    return res.status(400)
      .json({ error: "exercise name must be a nonempty string" });
  }
  const exercise = new Exercise({
    name: req.body.name,
  });
  const savedExercise = await exercise.save();
  return res.status(201).json(savedExercise);
});

module.exports = exerciseRouter;
