const mongoose = require("mongoose");
/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  exercises: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
});

workoutSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Workout", workoutSchema);
