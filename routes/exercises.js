const exerciseRouter = require("express").Router();
const Exercise = require("../models/exercise");
const Routine = require("../models/routine");
const Workout = require("../models/workout");
const Set = require("../models/set");

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

exerciseRouter.put("/:id", async (req, res) => {
  const editedExercise = await Exercise.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { name: req.body.name },
    { new: true, runValidators: true },
  );
  if (!editedExercise) {
    return res.status(404).json({ error: "Exercise not found or you don't have accesss to it." });
  }
  return res.status(200).json(editedExercise);
});

exerciseRouter.delete("/:id", async (req, res) => {
  const exerciseToDelete = await Exercise.findOne({ _id: req.params.id, user: req.user.id });
  if (exerciseToDelete) {
    const routinesAvailableToUser = await Routine.find({ user: req.params.user });
    const routinesToDelete = routinesAvailableToUser.filter((routine) => {
      if (routine.exercises.some((exerciseId) => exerciseId === req.params.id)) {
        return true;
      }
      return false;
    });
    await Promise.all(
      routinesToDelete.map((routine) => Workout.deleteMany({ routine: routine.id })),
    );
    await Set.deleteMany({ exercise: req.params.id });
    await Exercise.findByIdAndDelete(exerciseToDelete.id);
  }
  return res.status(204).end();
});

module.exports = exerciseRouter;
