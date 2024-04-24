const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Routine = require("../../models/routine");
const Exercise = require("../../models/exercise");
const User = require("../../models/user");
const testData = require("./testData");
const testHelpers = require("./testHelpers");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are a user, anonymous exercises and routines in the database", () => {
  let tokenOfRoutineOwner;
  const userToOwnRoutines = testData.initialUsers[0];
  beforeAll(async () => {
    await Exercise.deleteMany({});
    await User.deleteMany({});
    await testHelpers.addAnonymousExercisesToDb(testData.initialAnonymousExercises);
    [tokenOfRoutineOwner] = await testHelpers.addUsersToDbAndGetTokens(
      [userToOwnRoutines],
    );
  });
  beforeEach(async () => {
    await Routine.deleteMany({});
    await testHelpers.addRoutinesToDb(
      testData.initialRoutines.map((routine) => routine.name),
      userToOwnRoutines,
    );
  });
  describe("When logged in", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${tokenOfRoutineOwner}`);
    });
    it("routines are returned by a GET request to /api/routines", async () => {
      const res = await request
        .get("/api/routines")
        .expect(200);
      const recievedRoutines = res.body
        .map((routine) => {
          const exerciseNames = routine.exercises.map((exercise) => ({ name: exercise.name }));
          return {
            name: routine.name,
            exercises: exerciseNames,
          };
        })
        .toSorted((a, b) => a.name.localeCompare(b.name));
      expect(recievedRoutines).toEqual(testData.initialRoutines);
    });
    it("a routine is added by a POST request to /api/routines", async () => {
      const exercisesInDb = await Exercise.find({});
      await request
        .post("/api/routines")
        .send({
          name: "testRoutine",
          exercises: exercisesInDb.map((exercise) => exercise.id),
        })
        .expect(201);
      const routinesInDb = await Routine.find({});
      expect(routinesInDb.length).toBe(testData.initialRoutines.length + 1);
    });
  });
  describe("When not logged in", () => {
    beforeAll(() => {
      request.set("Authorization", "");
    });
    it("a GET request to /api/routines returns 401 unauthorized", async () => {
      await request
        .get("/api/routines")
        .expect(401);
    });
    it("a POST request to /api/routines returns 401 unauthorized", async () => {
      await request
        .post("/api/routines")
        .expect(401);
    });
  });
});
