const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const request = defaults(supertest(app));
const Routine = require("../../models/routine");
const Exercise = require("../../models/exercise");
const User = require("../../models/user");
const Set = require("../../models/set");
const testData = require("./testData");
const testHelpers = require("./testHelpers");
const Workout = require("../../models/workout");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are users, anonymous exercises, routines, workouts and sets in the database", () => {
  let tokens;
  beforeAll(async () => {
    await Workout.deleteMany({});
    await User.deleteMany({});
    await Exercise.deleteMany({});
    await Routine.deleteMany({});
    tokens = await testHelpers.addUsersToDbAndGetTokens(testData.initialUsers.slice(0, 2));
    await testHelpers.addAnonymousExercisesToDb(testData.initialAnonymousExercises);
    const exerciseIds = await testHelpers.getIdsOfExercisesInDbByNames(
      testData.initialAnonymousExercises.map((exercise) => exercise.name),
    );
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[0].name],
      exerciseIds.slice(0, 6),
      testData.initialUsers[0].username,
    );
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[1].name],
      exerciseIds.slice(6, 10),
      testData.initialUsers[1].username,
    );
    await testHelpers.addWorkoutsToDb(
      1,
      testData.initialRoutines[0].name,
      testData.initialUsers[0].username,
    );
    await testHelpers.addWorkoutsToDb(
      1,
      testData.initialRoutines[1].name,
      testData.initialUsers[1].username,
    );
  });
  beforeEach(async () => {
    await Set.deleteMany({});
    const userToOwnFirstSet = await testHelpers.getUserByJwtToken(tokens[0]);
    const userToOwnSecondSet = await testHelpers.getUserByJwtToken(tokens[1]);
    const workoutToAddFirstSetTo = await Workout.findOne({ user: userToOwnFirstSet.id });
    const workoutToAddSecondSetTo = await Workout.findOne({ user: userToOwnSecondSet.id });
    const exercises = await Exercise.find({});
    await testHelpers.addSetToDb(
      1,
      8,
      60,
      120,
      userToOwnFirstSet.username,
      workoutToAddFirstSetTo._id,
      "testnote",
      exercises[0]._id,
    );
    await testHelpers.addSetToDb(
      2,
      7,
      60,
      120,
      userToOwnSecondSet.username,
      workoutToAddSecondSetTo._id,
      "testnote2",
      exercises[1]._id,
    );
  });
  describe("When logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a GET request to /api/sets returns the sets completed by the logged in user but not any other sets", async () => {

    });
  });
  describe("When not logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", "");
    });
    it("a GET request to /api/sets returns 401 unauthorized", async () => {
      await request
        .get("/api/workouts")
        .expect(401);
    });
    it("a POST request to /api/sets returns 401 unauthorized", async () => {
      await request
        .post("/api/workouts")
        .expect(401);
    });
  });
});
