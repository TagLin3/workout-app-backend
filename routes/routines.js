const routineRouter = require("express").Router();
const Exercise = require("../models/exercise");
const Routine = require("../models/routine");

routineRouter.get("/", async (req, res) => {
  const routines = await Routine.find({ user: req.user.id }).populate("exercises");
  return res.json(routines);
});

routineRouter.get("/:id", async (req, res) => {
  const routine = await Routine.findById(req.params.id).populate("exercises");
  if (!routine || routine.toJSON().user !== req.user.id) {
    return res.status(404).json({ error: "routine not found" });
  }
  return res.json(routine);
});

routineRouter.post("/", async (req, res) => {
  const exercisesAvailableToUser = await Exercise
    .find({ $or: [{ user: req.user.id }, { user: undefined }] });
  const idsOfExercisesAvailableToUser = exercisesAvailableToUser
    .map((exercise) => exercise.toJSON().id);
  if (req.body.exercises.some(
    (exerciseId) => !idsOfExercisesAvailableToUser.includes(exerciseId),
  )) {
    return res.status(401).json({ error: "you do not have access to use one or more of the exercises" });
  }
  const routine = new Routine({
    name: req.body.name,
    user: req.user.id,
    exercises: req.body.exercises,
  });
  const savedRoutine = await routine.save();
  return res.status(201).json(savedRoutine);
});

module.exports = routineRouter;
