const mongoose = require("mongoose");
/* eslint no-param-reassign: 0 */

const exerciseInstanceSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  repRange: {
    type: String,
    validate: {
      validator: (obj) => {
        const correct = /\d+-\d+/;
        if (correct.test(obj)) {
          const [min, max] = obj.match(/\d+/g);
          if (min < max) {
            return true;
          }
        }
        return false;
      },
      message: "rep range must be of the format 'x-y' where x and y are numbers and x < y",
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
