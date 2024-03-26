const mongoose = require("mongoose");
/* eslint no-param-reassign: 0 */

const routineSchema = new mongoose.Schema({
  name: {
    type: String,
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
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Routine", routineSchema);
