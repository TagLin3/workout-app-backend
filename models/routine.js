const mongoose = require("mongoose");
/* eslint no-param-reassign: 0 */

const exerciseInstanceSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  repRange: {
    min: {
      type: Number,
      validate: {
        validator: (obj) => {

        },
        message: "min must be less than max",
      },
    },
    max: {
      type: Number,
      validate: {
        validator: (obj) => {

        },
        message: "max must be more than min",
      },
    },
  },
});

const routineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  exercises: {
    type: [exerciseInstanceSchema],
    required: true,
  },
});

routineSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.user = returnedObject.user.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Routine", routineSchema);
