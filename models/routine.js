const mongoose = require("mongoose");
/* eslint no-param-reassign: 0 */

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
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
    }],
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
