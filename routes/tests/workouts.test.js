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
  mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are users, anonymous exercises, routines and workouts in the database", () => {
  let tokens;
  beforeAll(async () => {
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
  });
  beforeEach(async () => {
    await Workout.deleteMany({});
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
  describe("When logged in as the completer of some workout", () => {
    beforeAll(async () => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a GET request to /api/workouts returns the workout completed by the logged in user but not the workout completed by another user", async () => {
      const res = await request
        .get("/api/workouts");
      const recievedWorkouts = res.body.map((workout) => ({
        routine: {
          name: workout.routine.name,
        },
      }));
      const expectedWorkout = {
        routine: {
          name: testData.initialRoutines[0].name,
        },
      };
      const unexpectedWorkout = {
        routine: {
          name: testData.initialRoutines[1].name,
        },
      };
      expect(recievedWorkouts).toContainEqual(expectedWorkout);
      expect(recievedWorkouts).not.toContainEqual(unexpectedWorkout);
    });
    it("a GET request to /api/workouts/:id?includeExercises returns the workout with the exercises populated", async () => {
      const availableWorkouts = await Workout.find(
        { user: await testHelpers.getUserByJwtToken(tokens[0]) },
      );
      const res = await request.get(`/api/workouts/${availableWorkouts[0].id}?includeExercises`);
      const { exercises } = res.body.routine;
      expect(exercises.map((exercise) => exercise.exercise.name)).not.toContainEqual(undefined);
    });
    it("a workout is added by a POST request to /api/workouts", async () => {
      const workoutsAtStart = await Workout.find({});
      const loggedInUser = await testHelpers.getUserByJwtToken(tokens[0]);
      const availableRoutine = await Routine.findOne({ user: loggedInUser.id });
      await request
        .post("/api/workouts")
        .send({
          routine: availableRoutine.id,
        })
        .expect(201);
      const workoutsAtEnd = await Workout.find({});
      expect(workoutsAtEnd.length).toBe(workoutsAtStart.length + 1);
    });
    it("a workout based on a routine not created by the logged in user can not be added", async () => {
      const workoutsAtStart = await Workout.find({});
      const notLoggedInUser = await testHelpers.getUserByJwtToken(tokens[1]);
      const unavailableRoutine = await Routine.findOne({ user: notLoggedInUser.id });
      await request
        .post("/api/workouts")
        .send({
          routine: unavailableRoutine.id,
        })
        .expect(404);
      const workoutsAtEnd = await Workout.find({});
      expect(workoutsAtEnd.length).toBe(workoutsAtStart.length);
    });
    describe("When there are sets assigned to a workout", () => {
      beforeEach(async () => {
        Set.deleteMany({});
        const loggedInUser = await testHelpers.getUserByJwtToken(tokens[0]);
        const availableWorkouts = await Workout.find(
          { user: loggedInUser },
        );
        const availableExercises = await Exercise.find({});
        const setToSave = new Set({
          number: 1,
          reps: 10,
          weight: 60,
          rest: 120,
          user: loggedInUser.id,
          workout: availableWorkouts[0].id,
          exercise: availableExercises[0].id,
          type: "regular",
        });
        await setToSave.save();
      });
      it("a GET request to /api/workouts/:id?includeSets returns the workout with the sets populated", async () => {
        const availableWorkouts = await Workout.find(
          { user: await testHelpers.getUserByJwtToken(tokens[0]) },
        );
        const res = await request
          .get(`/api/workouts/${availableWorkouts[0].id}?includeSets`)
          .expect(200);
        expect(res.body.sets).toBeDefined();
      });
      it("a DELETE request to /api/workouts/:id deletes the corresponding workout and the sets associated with it", async () => {
        const workoutToDelete = await Workout.findOne(
          { user: await testHelpers.getUserByJwtToken(tokens[0]) },
        );
        const setsOfWorkoutToDelete = await Set.find({ workout: workoutToDelete.id });
        await request
          .delete(`/api/workouts/${workoutToDelete.id}`)
          .expect(204);
        const workoutsAtEnd = await Workout.find({});
        const setsAtEnd = await Set.find({});
        expect(workoutsAtEnd).not.toContainEqual(workoutToDelete);
        setsOfWorkoutToDelete.forEach((set) => {
          expect(setsAtEnd).not.toContainEqual(set);
        });
      });
    });
  });
  describe("When not logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", "");
    });
    it("a GET request to /api/workouts returns 401 unauthorized", async () => {
      await request
        .get("/api/workouts")
        .expect(401);
    });
    it("a POST request to /api/workouts returns 401 unauthorized", async () => {
      await request
        .post("/api/workouts")
        .expect(401);
    });
  });
});
