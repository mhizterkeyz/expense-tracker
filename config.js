module.exports = () => ({
  port: process.env.PORT,
  databaseUrl: process.env.DB_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
});
