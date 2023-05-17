const dotenv = require("dotenv");

dotenv.config();

module.exports = () => ({
  isDev() {
    return ["development", "dev", "develop"].includes(process.env.NODE_ENV);
  },
  port: process.env.PORT,
  databaseUrl: process.env.DB_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
});
