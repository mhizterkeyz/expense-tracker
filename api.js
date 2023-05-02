const { compare } = require("bcryptjs");
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const database = require("./database");
const config = require("./config");

const api = Router();

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  OK: 200,
  CREATED: 201,
  SERVER_ERROR: 500,
};

const signInUser = (user) => {
  const conf = config();
  const token = jwt.sign({ id: user.id }, conf.jwt.secret, {
    expiresIn: conf.jwt.expiresIn,
  });

  return { user, token };
};

const sendJson = (res, status, message, data) => {
  res.status(status).json({ message, data });
};

const withErrorHandler = (action, func) => {
  return async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error) {
      console.debug(`error ${action}\n`, error);
      sendJson(res, HTTP_STATUS.SERVER_ERROR, "Server error");
    }
  };
};

const guard = () => {
  return async (req, res, next) => {
    try {
      const payload = jwt.verify(
        req.headers.authorization?.split("Bearer ")?.[1],
        config().jwt.secret
      );
      const user = await database.users.findById(payload.id);
      if (!user) {
        throw new Error();
      }

      req.user = user;

      next();
    } catch (error) {
      sendJson(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorizeed");
    }
  };
};

api.post(
  "/login",
  withErrorHandler("logging in", async (req, res) => {
    let user = await database.users.findOne({ name: req.body.name });
    if (user) {
      const validPassword = await compare(req.body.password, user.password);
      if (!validPassword) {
        sendJson(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
        return;
      }

      sendJson(res, HTTP_STATUS.OK, "Login successful", signInUser(user));
      return;
    }

    user = await database.users.create({
      name: req.body.name,
      password: req.body.password,
    });

    sendJson(res, HTTP_STATUS.CREATED, "Signup successful", signInUser(user));
  })
);

api.post(
  "/labels",
  guard(),
  withErrorHandler("adding label", async (req, res) => {
    const name = req.body.name || "Unlabelled";
    let value = Math.abs(Number(req.body.value));

    value = isNaN(value) ? 0 : value;

    const label = await database.labels.create({
      name,
      value,
      user: req.user.id,
    });

    sendJson(res, HTTP_STATUS.CREATED, "Label created", label);
  })
);

api.get("/labels", guard(), async (req, res) => {
  let startDate = new Date(req.query.start_date);
  let endDate = new Date(req.query.end_date);
  if (isNaN(startDate.getTime())) {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  }
  if (isNaN(endDate.getTime())) {
    endDate = new Date();
  }

  const labels = await database.labels.find({
    user: req.user.id,
    createdAt: { $gte: startDate, $lte: endDate },
  });

  let total = 0;
  let count = 0;

  const reduced = labels.reduce((acc, cur) => {
    const name = cur.name.toLowerCase();
    if (acc[name]) {
      acc[name].value += cur.value;
    } else {
      acc[name] = {
        name: cur.name,
        value: cur.value,
      };
    }
    total += cur.value;
    count += 1;

    return acc;
  }, {});

  sendJson(res, HTTP_STATUS.OK, "Labels retrieved", {
    labels: reduced,
    total,
    count,
  });
});

module.exports = api;
