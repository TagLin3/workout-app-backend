const jwt = require("jsonwebtoken");

const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
  } else if (err.name === "CastError") {
    res.status(400).json({ error: err.message });
  } else if (err.name === "JsonWebTokenError") {
    res
      .status(401)
      .set("WWW-Authenticate", "Bearer")
      .json({ error: "Invalid authorization token" });
  } else if (err.name === "TokenExpiredError") {
    res
      .status(401)
      .set("WWW-Authenticate", "Bearer")
      .json({ error: "Authorization token expired" });
  } else {
    res.status(500).json({ error: err.message }).end();
  }
  next(err);
};

const authorizer = async (req, res, next) => {
  const pathsThatDontRequire = [
    {
      path: /\/api\/login/,
      method: "POST",
    },
    {
      path: /\/api\/users/,
      method: "POST",
    },
    {
      path: /\/api\/users\/.+\/changePassword/,
      method: "PUT",
    },
  ];
  if (
    pathsThatDontRequire.some(
      (path) => path.path.test(req.path) && path.method === req.method,
    ) || !req.path.startsWith("/api")
  ) {
    return next();
  }
  const token = req.headers.authorization;
  if (token) {
    const user = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET,
    );
    req.user = user;
    return next();
  }
  return res
    .status(401)
    .set("WWW-Authenticate", "Bearer")
    .json({ error: "Authorization header missing" });
};

module.exports = { errorHandler, authorizer };
