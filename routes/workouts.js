const workoutRouter = require("express").Router();
const Workout = require("../models/workout");

workoutRouter.get("/", async (req, res) => {
  const workouts = await Workout.find({}).populate("exercises");
  return res.json(workouts);
});

workoutRouter.get("/:id", async (req, res) => {
  const workout = await Workout.findById(req.params.id).populate("exercises");
  return res.json(workout);
});

workoutRouter.post("/", async (req, res) => {
  if (!req.body.name || !req.body.exercises || req.body.exercises.length === 0) {
    return res.status(400)
      .json({ error: "name must be a nonempty string and exercises must be a nonempty array" });
  }
  const workout = new Workout({
    name: req.body.name,
    exercises: req.body.exercises,
  });
  const savedWorkout = await workout.save();
  return res.status(201).json(savedWorkout);
});

module.exports = workoutRouter;
