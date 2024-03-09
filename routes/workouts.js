const workoutRouter = require("express").Router();
const Workout = require("../models/workout");

workoutRouter.get("/", async (req, res) => {
  const workouts = await Workout.find({});
  res.send(workouts);
});

workoutRouter.post("/", async (req, res) => {
  const workout = new Workout({
    name: req.body.name,
    exercises: req.body.exercises,
  });
  await workout.save();
  res.end();
});

module.exports = workoutRouter;
