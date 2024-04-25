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
  const userToOwnLastRoutine = testData.initialUsers[1];
  beforeAll(async () => {
    await Exercise.deleteMany({});
    await User.deleteMany({});
    await testHelpers.addAnonymousExercisesToDb(testData.initialAnonymousExercises);
    [tokenOfRoutineOwner] = await testHelpers.addUsersToDbAndGetTokens(
      [userToOwnRoutines, userToOwnLastRoutine],
    );
  });
  beforeEach(async () => {
    await Routine.deleteMany({});
    const exercisesForUser1 = await Promise.all(
      testData.initialAnonymousExercises.slice(0, 6)
        .map((exercise) => Exercise.findOne({ name: exercise.name })),
    );
    const exerciseIdsForUser1 = exercisesForUser1.map((exercise) => exercise.id);
    const exercisesForUser2 = await Promise.all(
      testData.initialAnonymousExercises.slice(6, 10)
        .map((exercise) => Exercise.findOne({ name: exercise.name })),
    );
    const exerciseIdsForUser2 = exercisesForUser2.map((exercise) => exercise.id);
    await testHelpers.addRoutinesToDb(
      testData.initialRoutines.slice(0, 2).map((routine) => routine.name),
      exerciseIdsForUser1,
      userToOwnRoutines,
    );
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[2].name],
      exerciseIdsForUser2,
      userToOwnLastRoutine,
    );
  });
  describe("When logged in as the owner of some of the routines", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${tokenOfRoutineOwner}`);
    });
    it("a GET request to /api/routines returns the routines owned by the user", async () => {
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
      expect(recievedRoutines).toEqual(testData.initialRoutines.slice(0, 2));
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

describe("When there are users who owns user exercises in the database", () => {
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
    beforeAll(() => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a routine with user exercises owned by the logged in user can be added by a POST request to /api/routines", async () => {
      const foundUsers = await User.find({ username: testData.initialUsers[0].username });
      const user1ExercisesInDb = await Exercise.find({ user: foundUsers[0]._id });
      const exercisesToAdd = user1ExercisesInDb.map((exercise) => exercise.id);
      const res = await request
        .post("/api/routines")
        .send({
          name: "testRoutineWithUserExercises",
          exercises: exercisesToAdd,
        })
        .expect(201);
      const recievedRoutine = {
        name: res.body.name,
        exercises: res.body.exercises,
      };
      expect(recievedRoutine).toEqual({
        name: "testRoutineWithUserExercises",
        exercises: exercisesToAdd,
      });
    });
    it("a routine with user exercises not owned by the logged in user can't be added by a POST request to /api/routines", async () => {
      const foundUsers = await User.find({ username: testData.initialUsers[1].username });
      const user2ExercisesInDb = await Exercise.find({ user: foundUsers[0]._id });
      const exercisesToAdd = user2ExercisesInDb.map((exercise) => exercise.id);
      const res = await request
        .post("/api/routines")
        .send({
          name: "shouldNotWork",
          exercises: exercisesToAdd,
        })
        .expect(401);
      expect(res.body).toEqual({ error: "you do not have access to use one or more of the exercises" });
    });
  });
});
