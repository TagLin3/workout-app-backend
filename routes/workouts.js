const workoutRouter = require("express").Router();
const Workout = require("../models/workout");
const Set = require("../models/set");

workoutRouter.get("/", async (req, res) => {
  const workouts = await Workout.find({});
  return res.json(workouts);
});

workoutRouter.post("/", async (req, res) => {
  const workout = new Workout(req.body);
  const savedWorkout = await workout.save();
  return res.status(201).json(savedWorkout);
});

module.exports = workoutRouter;
