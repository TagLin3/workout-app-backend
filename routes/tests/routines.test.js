const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Routine = require("../../models/routine");
const Exercise = require("../../models/exercise");
const User = require("../../models/user");
const testData = require("./testData");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there is a routine in the database", () => {
  beforeAll(async () => {
    await Exercise.deleteMany({});
    const exercisesToSave = testData.initialExercises.map(
      (exercise) => new Exercise(exercise),
    );
    await Promise.all(
      exercisesToSave.map((exerciseToSave) => exerciseToSave.save()),
    );
    await User.deleteMany({});
    const userToSave = new User(testData.initialUsers[0]);
    await userToSave.save();
  });
  beforeEach(async () => {
    await Routine.deleteMany({});
    const availableExercises = await Exercise.find({});
    const idsOfAvailableExercises = availableExercises.map((exercise) => exercise.id);
    const userInDb = (await User.find({}))[0];
    const routineToSave = new Routine({
      name: testData.initialRoutineName,
      exercises: idsOfAvailableExercises,
      user: userInDb.id,
    });
    await routineToSave.save();
  });
  describe("When logged in", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${testData.token}`);
    });
    it("a GET request to /api/routines returns the saved routine", async () => {
      const res = await request
        .get("/api/routines")
        .expect(200);
      const recievedRoutine = res.body[0];
      console.log(recievedRoutine);
      console.log(res.body);
      console.log(await Routine.find({}));
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
