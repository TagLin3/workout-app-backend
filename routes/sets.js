const setRouter = require("express").Router();
const Set = require("../models/set");
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");

setRouter.get("/", async (req, res) => {
  let sets;
  if (req.query.filterByExercise !== undefined) {
    sets = await Set.find({ user: req.user.id, exercise: req.query.filterByExercise });
  } else {
    sets = await Set.find({ user: req.user.id });
  }
  if (req.query.includeExercises !== undefined) {
    await Set.populate(sets, { path: "exercise" });
  }
  return res.json(sets);
});

setRouter.post("/", async (req, res) => {
  if (!req.body.workout || !req.body.exercise) {
    return res.status(400).json({ error: "Workout and exercise are required fields" });
  }
  const workoutOfSet = await Workout.findOne({ _id: req.body.workout, user: req.user.id });
  const exerciseOfSet = await Exercise.findOne(
    {
      $or: [
        { _id: req.body.exercise, user: req.user.id },
        { _id: req.body.exercise, user: undefined },
      ],
    },
  );
  if (!workoutOfSet) {
    return res.status(404).json({ error: "Workout not found or you don't have access to it." });
  }
  if (!exerciseOfSet) {
    return res.status(404).json({ error: "Exercise not found or you don't have access to it." });
  }
  const set = new Set({ ...req.body, user: req.user.id });
  const savedSet = await set.save();
  return res.status(201).json(savedSet);
});

setRouter.delete("/:id", async (req, res) => {
  await Set.deleteOne({ _id: req.params.id, user: req.user.id });
  return res.status(204).end();
});

setRouter.put("/:id", async (req, res) => {
  const {
    user, date, type, number, reps, weight, rest, note,
  } = req.body;
  const updatedSet = await Set.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    {
      user, date, type, number, reps, weight, rest, note,
    },
    { new: true, runValidators: true },
  );
  if (!updatedSet) {
    return res.status(404).json({ error: "Set not found or you don't have accesss to it." });
  }
  return res.status(200).json(updatedSet);
});

module.exports = setRouter;
