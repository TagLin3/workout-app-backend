const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Exercise = require("../../models/exercise");
const testData = require("./testData");
require("dotenv").config();

describe("When there are exercises in the database", () => {
  beforeEach(async () => {
    await Exercise.deleteMany({})
    const exercisesToSave = testData.initialExercises.map((exercise) => new Exercise(exercise));
    await Promise.all(exercisesToSave.map(exerciseToSave) => exercisesToSave.save())
  });
});
