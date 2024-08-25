const userRouter = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

userRouter.get("/", async (req, res) => {
  const admin = await User.findOne({ username: "admin" });
  if (!admin || req.user.id !== admin.id) {
    return res.status(401).json({ error: "Only administrators can access this route" });
  }
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
  if (req.body.password.length < 1) {
    return res.status(400).json({ error: "Minimum length for a password is 1 character" });
  }
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
  const userToUpdate = await User.findById(req.params.id);
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    {
      name: userToUpdate.name === req.body.name ? undefined : req.body.name,
      username: userToUpdate.username === req.body.username ? undefined : req.body.username,
    },
    { new: true, runValidators: true },
  );
  return res.status(200).json(updatedUser);
});

userRouter.put("/:id/changePassword", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (newPassword.length < 1) {
    return res.status(400).json({ error: "Minimum length for a password is 1 character" });
  }
  const userToChangePasswordFor = await User.findById(req.params.id);
  if (!userToChangePasswordFor) {
    return res.status(404).json({ error: "User not found" });
  }
  const passwordCorrect = await bcrypt.compare(oldPassword, userToChangePasswordFor.passwordHash);
  if (!passwordCorrect) {
    return res.status(401).json({ error: "Old password is incorrect" });
  }
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: req.params.id }, { passwordHash: newPasswordHash });
  return res.status(200).end();
});

module.exports = userRouter;
