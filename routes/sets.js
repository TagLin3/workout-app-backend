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
  const workoutsAvailableToUser = await Workout
    .find({ user: req.user.id });
  const idsOfworkoutsAvailableToUser = workoutsAvailableToUser
    .map((workout) => workout.toJSON().id);
  const exercisesAvailableToUser = await Exercise
    .find({ $or: [{ user: req.user.id }, { user: undefined }] });
  const idsOfExercisesAvailableToUser = exercisesAvailableToUser
    .map((exercise) => exercise.toJSON().id);
  if (!(req.body.workout && req.body.exercise)) {
    return res.status(400).json({ error: "set and workout are required fields" });
  }
  if (!idsOfworkoutsAvailableToUser.includes(req.body.workout)) {
    return res.status(401).json({ error: "you do not have access to this workout" });
  }
  if (!idsOfExercisesAvailableToUser.includes(req.body.exercise)) {
    return res.status(401).json({ error: "you do not have access to this exercise" });
  }
  const set = new Set({ ...req.body, user: req.user.id });
  const savedSet = await set.save();
  return res.status(201).json(savedSet);
});

setRouter.delete("/:id", async (req, res) => {
  await Set.deleteOne({ _id: req.params.id, user: req.user.id });
  res.status(204).end();
});

setRouter.put("/:id", async (req, res) => {
  const updatedSet = await Set.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true },
  );
  res.status(200).json(updatedSet).end();
});

module.exports = setRouter;
