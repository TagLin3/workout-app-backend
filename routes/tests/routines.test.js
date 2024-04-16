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

describe("When there are routines in the database", () => {
  let token;
  beforeAll(async () => {
    await Exercise.deleteMany({});
    await User.deleteMany({});
    await testHelpers.addExercisesToDb(testData.initialExercises);
    token = await testHelpers.addOneUserToDbAndGetToken(testData.initialUsers[0]);
  });
  beforeEach(async () => {
    await Routine.deleteMany({});
    await testHelpers.addRoutinesToDb(testData.initialRoutineNames);
  });
  describe("When logged in", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${token}`);
    });
    it("a GET request to /api/routines returns the saved routine", async () => {
      const res = await request
        .get("/api/routines")
        .expect(200);
      const recievedRoutine = res.body[0];
      expect(recievedRoutine.name).toBe(testData.initialRoutineName);
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
