const loginRouter = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

loginRouter.post("/", async (req, res) => {
  const { username, password } = req.body;
  const userToLogIn = await User.findOne({ username });
  if (!userToLogIn) {
    return res.status(401).json({
      error: "Username and password don't match.",
    });
  }
  const passwordCorrect = await bcrypt.compare(password, userToLogIn.passwordHash);
  if (!passwordCorrect) {
    return res.status(401).json({
      error: "Username and password don't match.",
    });
  }
  const expireHours = 10;
  const token = jwt.sign(userToLogIn.toJSON(), process.env.JWT_SECRET, {
    expiresIn: `${expireHours}h`,
  });
  return res.json({
    token,
    username,
    id: userToLogIn.id,
    name: userToLogIn.name,
    expiresAt: Date.now() + expireHours * 60 * 60 * 1000,
  });
});

module.exports = loginRouter;
