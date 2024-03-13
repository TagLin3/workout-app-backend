const setRouter = require("express").Router();
const Set = require("../models/set");

setRouter.get("/", async (req, res) => {
  const sets = await Set.find({});
  return res.json(sets);
});

setRouter.post("/", async (req, res) => {
  const set = new Set(req.body);
  const savedSet = await set.save();
  return res.status(201).json(savedSet);
});

module.exports = setRouter;
