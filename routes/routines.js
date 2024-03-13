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

routineRouter.post("/", async (req, res) => {
  const routine = new Routine(req.body);
  const savedRoutine = await routine.save();
  return res.status(201).json(savedRoutine);
});

module.exports = routineRouter;
