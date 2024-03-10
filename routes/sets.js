const setRouter = require("express").Router();
const Set = require("../models/set");

setRouter.get("/", async (req, res) => {
  const sets = await Set.find({});
  return res.json(sets);
});

setRouter.post("/", async (req, res) => {
  const {
    reps, weight, rest, note,
  } = req.body;
  const set = new Set({
    reps, weight, rest, note,
  });
  const savedSet = await set.save();
  return res.status(201).json(savedSet);
});

module.exports = setRouter;
