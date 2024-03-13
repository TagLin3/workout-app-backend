const mongoose = require("mongoose");
/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

const workoutSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now(),
  },
  routine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Routine",
    required: true,
  },
});

workoutSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

workoutSchema.set("strictPopulate", false);

module.exports = mongoose.model("Workout", workoutSchema);
