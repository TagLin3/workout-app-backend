const workoutRouter = require("express").Router();
const Workout = require("../models/workout");
const Set = require("../models/set");

workoutRouter.get("/", async (req, res) => {
  const workouts = await Workout.find({});
  return res.json(workouts);
});

workoutRouter.get("/:id", async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (req.query.includeSets !== undefined) {
    const sets = await Set.find({ workout: workout.id });
    if (req.query.populateExercises !== undefined) {
      await Set.populate(sets, "exercise");
    }
    return res.json({
      ...workout.toJSON(),
      sets,
    });
  }
  return res.json(workout);
});

workoutRouter.post("/", async (req, res) => {
  const workout = new Workout(req.body);
  const savedWorkout = await workout.save();
  return res.status(201).json(savedWorkout);
});

module.exports = workoutRouter;
