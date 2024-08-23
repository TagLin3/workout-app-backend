const mongoose = require("mongoose");
/* eslint no-param-reassign: 0 */

const setSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["regular", "dropset"],
  },
  dropSetNumber: {
    type: Number,
    required() { return this.type === "dropset"; },
  },
  number: {
    type: Number,
    required: true,
    validate: {
      validator: (number) => Number.isInteger(number) && number > 0,
      message: "Error: Number should be above zero and an integer",
    },
  },
  reps: {
    type: Number,
    required: true,
    validate: {
      validator: (number) => Number.isInteger(number) && number > 0,
      message: "Should be above zero and an integer",
    },
  },
  weight: {
    type: Number,
    required: true,
    min: [0, "Should be non-negative"],
  },
  rest: {
    type: Number,
    required: true,
    min: [0, "Should be non-negative"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  note: {
    type: String,
  },
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  date: {
    type: Date,
    default: () => Date.now(),
  },
});

setSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Set", setSchema);
