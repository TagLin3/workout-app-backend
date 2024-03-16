const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
  } else if (err.name === "CastError") {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: "some unknown error occured" }).end();
  }
  next(err);
};

module.exports = { errorHandler };
