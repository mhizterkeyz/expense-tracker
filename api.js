const { compare } = require("bcryptjs");
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const moment = require("moment");
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
    const date = req.body.date;
    const description = req.body.description;
    let value = Math.abs(Number(req.body.value));

    value = isNaN(value) ? 0 : value;

    const label = await database.labels.create({
      name,
      value,
      user: req.user.id,
      date,
      description,
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
  });

  const thisMonth = moment().startOf("month");
  const lastMonth = thisMonth.clone().subtract(1, "month");
  const threeMonthsAgo = lastMonth.clone().subtract(1, "month");
  const names = {};
  const numbers = {};
  let allTimeTotal = 0;
  let total = 0;

  const processValues = (key, cur, name) => {
    numbers[`${key}Total`] = (numbers[`${key}Total`] || 0) + cur.value;
    names[`${key}Count`] = (names[`${key}Count`] || 0) + 1;
    numbers[`${key}Average`] = numbers[`${key}Total`] / names[`${key}Count`];
    names[`${key}${name}`] = (names[`${key}${name}`] || 0) + cur.value;
    if (
      !numbers[`${key}Max`] ||
      names[`${key}${name}`] > numbers[`${key}Max`].value
    ) {
      numbers[`${key}Max`] = {
        name: cur.name,
        value: names[`${key}${name}`],
      };
    }

    if (
      !numbers[`${key}Min`] ||
      names[`${key}${name}`] <
        names[`${key}${numbers[`${key}Min`].name.toLowerCase()}`]
    ) {
      numbers[`${key}Min`] = {
        name: cur.name,
        value: names[`${key}${name}`],
      };
    }
  };

  const reduced = labels.reduce((acc, cur) => {
    const name = cur.name.toLowerCase();

    allTimeTotal += cur.value;

    if (thisMonth.isSameOrBefore(cur.date || cur.createdAt)) {
      processValues("thisMonth", cur, name);
    } else if (lastMonth.isSameOrBefore(cur.date || cur.createdAt)) {
      processValues("lastMonth", cur, name);
    } else if (threeMonthsAgo.isSameOrBefore(cur.date || cur.createdAt)) {
      processValues("threeMonthsAgo", cur, name);
    }

    if (
      moment(startDate).isSameOrBefore(cur.date || cur.createdAt) &&
      moment(endDate).isSameOrAfter(cur.date || cur.createdAt)
    ) {
      processValues("period", cur, name);
      total += cur.value;
      if (acc[name]) {
        acc[name].value += cur.value;
      } else {
        acc[name] = {
          name: cur.name,
          value: cur.value,
        };
      }
    }

    return acc;
  }, {});

  sendJson(res, HTTP_STATUS.OK, "Labels retrieved", {
    labels: reduced,
    total,
    ...numbers,
  });
});

module.exports = api;
