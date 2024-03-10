const mongoose = require("mongoose");
/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

exerciseSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
    return returnedObject;
  },
});

module.exports = mongoose.model("Exercise", exerciseSchema);
