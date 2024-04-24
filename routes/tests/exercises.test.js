const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Exercise = require("../../models/exercise");
const testData = require("./testData");
const testHelpers = require("./testHelpers");
const User = require("../../models/user");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are anonymous exercises in the database", () => {
  beforeEach(async () => {
    await Exercise.deleteMany({});
    await testHelpers.addAnonymousExercisesToDb(testData.initialAnonymousExercises);
  });
  describe("When logged in", () => {
    beforeAll(async () => {
      const [token] = await testHelpers.addUsersToDbAndGetTokens([testData.initialUsers[0]]);
      request.set("Authorization", `Bearer ${token}`);
    });
    it("all anonymous exercises are returned by a GET request to /api/exercises", async () => {
      const res = await request
        .get("/api/exercises")
        .expect(200);
      const returnedExercises = res.body
        .map((returnedExercise) => ({ name: returnedExercise.name }))
        .toSorted((a, b) => a.name.localeCompare(b.name));
      expect(returnedExercises).toEqual(testData.initialAnonymousExercises);
    });
    it("a user exercise can added by a POST request to /api/exercises", async () => {
      await request
        .post("/api/exercises")
        .send({
          name: "testExercise",
        })
        .expect(201);
      const exercisesInDb = await Exercise.find({});
      expect(exercisesInDb.length).toBe(testData.initialAnonymousExercises.length + 1);
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
describe("When there are users and user exercises in the database", () => {
  let tokens;
  beforeAll(async () => {
    await User.deleteMany({});
    tokens = await testHelpers.addUsersToDbAndGetTokens(testData.initialUsers.slice(0, 2));
  });
  beforeEach(async () => {
    await Exercise.deleteMany({});
    await testHelpers.addUserExercisesToDb(
      testData.initialUserExercisesForUser1,
      testData.initialUsers[0],
    );
    await testHelpers.addUserExercisesToDb(
      testData.initialUserExercisesForUser2,
      testData.initialUsers[1],
    );
  });
  describe("When logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a GET request to /api/exercises returns the exercises for the logged in user", async () => {
      const res = await request
        .get("/api/exercises")
        .expect(200);
      const returnedExercises = res.body
        .map((returnedExercise) => ({ name: returnedExercise.name }));
      expect(returnedExercises).toContainEqual(testData.initialUserExercisesForUser1[0]);
      expect(returnedExercises).toContainEqual(testData.initialUserExercisesForUser1[1]);
    });
    it("a GET request to /api/exercises doesn't return the exercises for other users", async () => {
      const res = await request
        .get("/api/exercises")
        .expect(200);
      const returnedExercises = res.body
        .map((returnedExercise) => ({ name: returnedExercise.name }));
      expect(returnedExercises).not.toContainEqual(testData.initialUserExercisesForUser2[0]);
      expect(returnedExercises).not.toContainEqual(testData.initialUserExercisesForUser2[1]);
    });
  });
});
