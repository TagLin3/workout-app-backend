const workoutRouter = require("express").Router();
const Workout = require("../models/workout");
const Set = require("../models/set");
const Routine = require("../models/routine");

workoutRouter.get("/", async (req, res) => {
  const workouts = await Workout.find({ user: req.user.id }).populate("routine");
  return res.json(workouts);
});

workoutRouter.get("/:id", async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, user: req.user.id }).populate({
    path: "routine",
    populate: req.query.includeExercises !== undefined
      ? { path: "exercises.exercise" }
      : undefined,
  });
  if (!workout) {
    return res.status(404).json({ error: "workout not found" });
  }
  if (req.query.includeSets !== undefined) {
    const sets = await Set.find({ workout: workout.id });
    return res.json({
      ...workout.toJSON(),
      sets,
    });
  }
  return res.json(workout);
});

workoutRouter.post("/", async (req, res) => {
  const routinesAvailableToUser = await Routine.find({ user: req.user.id });
  const idsOfRoutinesAvailableToUser = routinesAvailableToUser
    .map((routine) => routine.toJSON().id);
  if (!idsOfRoutinesAvailableToUser.includes(req.body.routine)) {
    return res.status(401).json({ error: "you do not have access to this routine" });
  }
  if (!req.body.routine.active) {
    return res.status(401).json({ error: "you can't create a workout based on an inactive routine" });
  }
  const workout = new Workout({
    routine: req.body.routine,
    user: req.user.id,
  });
  const savedWorkout = await workout.save();
  return res.status(201).json(savedWorkout);
});

workoutRouter.delete("/:id", async (req, res) => {
  const workoutToDelete = await Workout.findOne({ _id: req.params.id, user: req.user.id });
  if (workoutToDelete) {
    await Workout.findByIdAndDelete(req.params.id);
  }
  const setsToDelete = await Set.find({ workout: req.params.id, user: req.user.id });
  if (setsToDelete) {
    await Set.deleteMany({ workout: req.params.id });
  }
  return res.status(204).end();
});

module.exports = workoutRouter;
