const loginRouter = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

loginRouter.post("/", async (req, res) => {
  const { username, password } = req.body;
  const userToLogIn = await User.findOne({ username });
  if (!userToLogIn) {
    return res.status(401).json({
      error: "username or password incorrect",
    });
  }
  const passwordCorrect = await bcrypt.compare(password, userToLogIn.passwordHash);
  if (!passwordCorrect) {
    return res.status(401).json({
      error: "username or password incorrect",
    });
  }
  const token = jwt.sign(userToLogIn.toJSON(), process.env.JWT_SECRET, {
    expiresIn: "10h",
  });
  return res.json({ token });
});

module.exports = loginRouter;
