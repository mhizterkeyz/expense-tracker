const axios = require("axios");
const cors = require("cors");
const { CronJob } = require("cron");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const config = require("./config");
const api = require("./api");

const app = express();
const { port } = config();

app.use(cors("*"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      imgSrc: ["'self'", "https://www.w3schools.com/howto/img_avatar2.png"],
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", api);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

new CronJob(
  "*/10 * * * * *",
  function () {
    axios.get("https://expense-tracker-s65i.onrender.com").catch(console.debug);
  },
  null,
  true,
  "America/Los_Angeles"
);
