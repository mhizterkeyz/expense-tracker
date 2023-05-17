const mongoose = require("mongoose");
const config = require("./config");
const { hash } = require("bcryptjs");

mongoose
  .connect(config().databaseUrl)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => {
    console.log(`error connecting to database - ${error.message}`);
  });

const transform = (_doc, ret) => {
  delete ret._id;
  delete ret.__v;
  delete ret.password;
};

const labels = mongoose.model(
  "labels",
  mongoose.Schema(
    {
      name: String,
      value: Number,
      user: mongoose.SchemaTypes.ObjectId,
      description: String,
      date: Date,
    },
    { timestamps: true, toJSON: { virtuals: true, transform } }
  )
);

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform,
    },
  }
);

UserSchema.pre("save", async function hashPassword(next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 8);
  }

  next();
});

const users = mongoose.model("users", UserSchema);

module.exports = {
  labels,
  users,
};
