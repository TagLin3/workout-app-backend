const userRouter = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

userRouter.get("/", async (req, res) => {
  const users = await User.find({});
  return res.json(users);
});

userRouter.get("/:id", async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(404).json({ error: "User not found or you don't have access to view this user." });
  }
  const user = await User.findById(req.params.id);
  return res.json(user);
});

userRouter.post("/", async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    passwordHash,
    name: req.body.name,
  });
  const savedUser = await user.save();
  return res.status(201).json(savedUser);
});

userRouter.put("/:id", async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(404).json({ error: "User not found or you don't have access to edit this user." });
  }
  const updatedUser = User.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true },
  );
  return res.status(200).json(updatedUser);
});

module.exports = userRouter;
