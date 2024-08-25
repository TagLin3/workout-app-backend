const distRouter = require("express").Router();
const path = require("path");

distRouter.get("/", (req, res) => {
  if (req.baseUrl.startsWith("/assets/")) {
    const fileName = req.baseUrl.slice(8);
    return res.sendFile(path.join(__dirname, "../dist/assets/", fileName));
  }
  return res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

module.exports = distRouter;
