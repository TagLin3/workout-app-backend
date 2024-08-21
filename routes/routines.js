const routineRouter = require("express").Router();
const Exercise = require("../models/exercise");
const Routine = require("../models/routine");
const Workout = require("../models/workout");
const Set = require("../models/set");

routineRouter.get("/", async (req, res) => {
  if (req.query.activeOnly !== undefined) {
    const routines = await Routine.find({ user: req.user.id, active: true })
      .populate("exercises.exercise");
    return res.json(routines);
  }
  if (req.query.inactiveOnly !== undefined) {
    const routines = await Routine.find({ user: req.user.id, active: false })
      .populate("exercises.exercise");
    return res.json(routines);
  }
  const routines = await Routine.find({ user: req.user.id })
    .populate("exercises.exercise");
  return res.json(routines);
});

routineRouter.get("/:id", async (req, res) => {
  const routine = await Routine.findOne({ _id: req.params.id, user: req.user.id })
    .populate("exercises.exercise");
  if (!routine) {
    return res.status(404).json({ error: "Routine not found or you don't have access to it." });
  }
  return res.json(routine);
});

routineRouter.post("/", async (req, res) => {
  const exercisesAvailableToUser = await Exercise
    .find({ $or: [{ user: req.user.id }, { user: undefined }] });
  const idsOfExercisesAvailableToUser = exercisesAvailableToUser
    .map((exercise) => exercise.toJSON().id);
  const exercisesUsedInRoutine = req.body.exercises.map((exercise) => exercise.exercise);
  if (exercisesUsedInRoutine.some(
    (exerciseId) => !idsOfExercisesAvailableToUser.includes(exerciseId),
  )) {
    return res.status(404).json({ error: "One or more of the exercises can't be found or you don't have access to them." });
  }
  const routine = new Routine({ ...req.body, user: req.user.id });
  const savedRoutine = await routine.save();
  return res.status(201).json(savedRoutine);
});

routineRouter.put("/:id/toggleActivity", async (req, res) => {
  const routineToUpdate = await Routine.findOne({ _id: req.params.id, user: req.user.id });
  if (!routineToUpdate) {
    return res.status(404).json({ error: "Routine not found or you don't have access to it." });
  }
  await Routine.findByIdAndUpdate(req.params.id, {
    active: !routineToUpdate.active,
  });
  return res.status(200).end();
});

routineRouter.delete("/:id", async (req, res) => {
  const routineToDelete = await Routine.findOne({ _id: req.params.id, user: req.user.id });
  if (routineToDelete) {
    if (routineToDelete.active) {
      return res.status(400).json({ error: "Only inactive routines can be deleted." });
    }
    const workoutsToDeleteSetsFor = await Workout.find({ routine: req.params.id });
    await Promise.all(
      workoutsToDeleteSetsFor.map(
        (workoutToDeleteSetFor) => Set.deleteMany({ workout: workoutToDeleteSetFor.id }),
      ),
    );
    await Workout.deleteMany({ routine: req.params.id });
    await Routine.findByIdAndDelete(req.params.id);
  }
  return res.status(204).end();
});

module.exports = routineRouter;
