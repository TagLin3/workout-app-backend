const setRouter = require("express").Router();
const Set = require("../models/set");

setRouter.get("/", async (req, res) => {
  const sets = await Set.find({});
  return res.json(sets);
});

setRouter.post("/", async (req, res) => {
  if (req.query.saveMultiple !== undefined) {
    const savedSets = await Promise.all(req.body.map(async (set) => {
      const setToSave = new Set(set);
      return setToSave.save();
    }));
    return res.status(201).json(savedSets);
  }
  const set = new Set(req.body);
  const savedSet = await set.save();
  return res.status(201).json(savedSet);
});

module.exports = setRouter;
