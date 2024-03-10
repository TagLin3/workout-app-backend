const errorHandler = (err, req, res, next) => {
  console.log(err);
  res.status(400).end();
};

module.exports = { errorHandler };
