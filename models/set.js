const mongoose = require("mongoose");
/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

const setSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  rest: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    required: false,
  },
  workout: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

setSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Set", setSchema);
