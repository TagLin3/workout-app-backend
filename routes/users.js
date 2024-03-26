const userRouter = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

userRouter.get("/", async (req, res) => {
  const users = await User.find({});
  return res.json(users);
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

module.exports = userRouter;
