const routineRouter = require("express").Router();
const Routine = require("../models/routine");

routineRouter.get("/", async (req, res) => {
  const routines = await Routine.find({}).populate("exercises");
  return res.json(routines);
});

routineRouter.get("/:id", async (req, res) => {
  const routine = await Routine.findById(req.params.id).populate("exercises");
  return res.json(routine);
});

routineRouter.post("/", async (req, res, next) => {
  // if (!req.body.name || !req.body.exercises || req.body.exercises.length === 0) {
  //   return res.status(400)
  //     .json({ error: "name must be a nonempty string and exercises must be a nonempty array" });
  // }
  try {
    const routine = new Routine({
      name: req.body.name,
      exercises: req.body.exercises,
    });
    const savedRoutine = await routine.save();
    return res.status(201).json(savedRoutine);
  } catch (err) {
    next(err);
  }
});

module.exports = routineRouter;
