const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Exercise = require("../../models/exercise");
const testData = require("./testData");
const testHelpers = require("./testHelpers");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are exercises in the database", () => {
  beforeEach(async () => {
    await Exercise.deleteMany({});
    await testHelpers.addExercisesToDb(testData.initialExercises);
  });
  describe("When logged in", () => {
    beforeAll(async () => {
      const token = await testHelpers.addOneUserToDbAndGetToken(testData.initialUsers[0]);
      request.set("Authorization", `Bearer ${token}`);
    });
    it("exercises are returned by a GET request to /api/exercises", async () => {
      const res = await request
        .get("/api/exercises")
        .expect(200);
      const returnedExercises = res.body
        .map((returnedExercise) => ({ name: returnedExercise.name }));
      expect(returnedExercises).toEqual(testData.initialExercises);
    });
    it("an exercise is added by a POST request to /api/exercises", async () => {
      await request
        .post("/api/exercises")
        .send({
          name: "testExercise",
        })
        .expect(201);
      const exercisesInDb = await Exercise.find({});
      expect(exercisesInDb.length).toBe(testData.initialExercises.length + 1);
    });
  });
  describe("When not logged in", () => {
    beforeAll(() => {
      request.set("Authorization", "");
    });
    it("a GET request to /api/exercises returns 401 unauthorized", async () => {
      await request
        .get("/api/exercises")
        .expect(401);
    });
    it("a POST request to /api/exercises returns 401 unauthorized", async () => {
      await request
        .post("/api/exercises")
        .expect(401);
    });
  });
});
