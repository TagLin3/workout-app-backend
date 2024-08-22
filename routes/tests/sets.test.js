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

describe("When there are users, anonymous exercises, routines, workouts and sets in the database", () => {
  let tokens;
  beforeAll(async () => {
    await Workout.deleteMany({});
    await User.deleteMany({});
    await Exercise.deleteMany({});
    await Routine.deleteMany({});
    tokens = await testHelpers.addUsersToDbAndGetTokens(
      testData.initialUsers.slice(0, 2),
    );
    await testHelpers.addAnonymousExercisesToDb(
      testData.initialAnonymousExercises,
    );
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
    const workoutToAddFirstSetTo = await Workout.findOne({
      user: userToOwnFirstSet.id,
    });
    const workoutToAddSecondSetTo = await Workout.findOne({
      user: userToOwnSecondSet.id,
    });
    const exercises = (await Exercise.find({})).toSorted();
    await testHelpers.addSetToDb(
      testData.initialSets[0],
      userToOwnFirstSet.username,
      workoutToAddFirstSetTo.id,
      exercises[0].id,
    );
    await testHelpers.addSetToDb(
      testData.initialSets[1],
      userToOwnFirstSet.username,
      workoutToAddFirstSetTo.id,
      exercises[1].id,
    );
    await testHelpers.addSetToDb(
      testData.initialSets[2],
      userToOwnSecondSet.username,
      workoutToAddSecondSetTo.id,
      exercises[2].id,
    );
  });
  describe("When logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a GET request to /api/sets returns the sets completed by the logged in user but not any other sets", async () => {
      const res = await request.get("/api/sets").expect(200);
      const recievedSets = res.body.map((set) => ({
        number: set.number,
        weight: set.weight,
        reps: set.reps,
        rest: set.rest,
        note: set.note,
      }));
      expect(recievedSets).toContainEqual(testData.initialSets[0]);
      expect(recievedSets).toContainEqual(testData.initialSets[1]);
      expect(recievedSets).not.toContainEqual(testData.initialSets[2]);
    });
    it("a GET request to /api/sets?filterByExercise=exerciseToFilterBy returns the sets for the exercise exerciseToFilterBy", async () => {
      const exercises = (await Exercise.find({})).toSorted();
      const res = await request
        .get(`/api/sets?filterByExercise=${exercises[0].id}`)
        .expect(200);
      const recievedSets = res.body.map((set) => ({
        number: set.number,
        weight: set.weight,
        reps: set.reps,
        rest: set.rest,
        note: set.note,
      }));
      expect(recievedSets).toContainEqual(testData.initialSets[0]);
      expect(recievedSets).not.toContainEqual(testData.initialSets[1]);
    });
    it("a GET request to /api/sets?includeExercises returns the sets with the exercises populated", async () => {
      const res = await request.get("/api/sets?includeExercises").expect(200);
      const exercisesOfRecievedSets = res.body.map((set) => set.exercise);
      expect(
        exercisesOfRecievedSets.map((exercise) => exercise.name),
      ).not.toContainEqual(undefined);
    });
    it("a set is added by a POST request to /api/sets", async () => {
      const setsAtStart = await Set.find({});
      const exercises = await Exercise.find({});
      const loggedInUser = await testHelpers.getUserByJwtToken(tokens[0]);
      const workout = await Workout.findOne({ user: loggedInUser.id });
      await request
        .post("/api/sets")
        .send({
          number: 1,
          weight: 123,
          reps: 1,
          rest: 999,
          exercise: exercises[0].id,
          workout: workout.id,
          type: "regular",
        })
        .expect(201);
      const setsAtEnd = await Set.find({});
      expect(setsAtEnd.length).toBe(setsAtStart.length + 1);
    });
    it("a set without a workout and an exercise can't be added", async () => {
      const setsAtStart = await Set.find({});
      await request
        .post("/api/sets")
        .send({
          number: 1,
          weight: 123,
          reps: 1,
          rest: 999,
          type: "regular",
        })
        .expect(400);
      const setsAtEnd = await Set.find({});
      expect(setsAtEnd.length).toBe(setsAtStart.length);
    });
    it("a set can't be added to a workout owned by another user", async () => {
      const setsAtStart = await Set.find({});
      const exercises = await Exercise.find({});
      const userNotLoggedIn = await testHelpers.getUserByJwtToken(tokens[1]);
      const workoutNotAvailable = await Workout.findOne({
        user: userNotLoggedIn.id,
      });
      await request
        .post("/api/sets")
        .send({
          ...testData.initialSets[0],
          exercise: exercises[0],
          workout: workoutNotAvailable.id,
        })
        .expect(404);
      const setsAtEnd = await Set.find({});
      expect(setsAtEnd.length).toBe(setsAtStart.length);
    });
    it("a PUT request to /api/sets/:id updates the corresponding set and returns the updated set", async () => {
      const setToUpdate = await Set.findOne(
        { user: (await testHelpers.getUserByJwtToken(tokens[0]))._id },
      );
      const res = await request
        .put(`/api/sets/${setToUpdate.id}`)
        .send({
          weight: 1000,
        })
        .expect(200);
      expect(res.body.weight).toBe(1000);
      const setAtEnd = await Set.findById(setToUpdate.id);
      expect(setAtEnd.weight).toBe(1000);
    });
    it("a DELETE request to /api/sets/:id deletes the corresponding set", async () => {
      const setToDelete = await Set.findOne(
        { user: (await testHelpers.getUserByJwtToken(tokens[0]))._id },
      );
      await request
        .delete(`/api/sets/${setToDelete.id}`)
        .expect(204);
      const setsAtEnd = await Set.find({});
      const idsOfSetsAtEnd = setsAtEnd.map((set) => set.id);
      expect(idsOfSetsAtEnd).not.toContain(setToDelete.id);
    });
  });
  describe("When not logged in", () => {
    beforeAll(async () => {
      request.set("Authorization", "");
    });
    it("a GET request to /api/sets returns 401 unauthorized", async () => {
      await request.get("/api/workouts").expect(401);
    });
    it("a POST request to /api/sets returns 401 unauthorized", async () => {
      await request.post("/api/workouts").expect(401);
    });
  });
});

describe("When there are users with user exercises, routines and workouts in the database", () => {
  let tokens;
  beforeAll(async () => {
    await Workout.deleteMany({});
    await User.deleteMany({});
    await Exercise.deleteMany({});
    await Routine.deleteMany({});
    tokens = await testHelpers.addUsersToDbAndGetTokens(
      testData.initialUsers.slice(0, 2),
    );
    const user1 = await testHelpers.getUserByJwtToken(tokens[0]);
    const user2 = await testHelpers.getUserByJwtToken(tokens[1]);
    await testHelpers.addUserExercisesToDb(
      testData.initialUserExercisesForUser1,
      testData.initialUsers[0],
    );
    await testHelpers.addUserExercisesToDb(
      testData.initialUserExercisesForUser2,
      testData.initialUsers[1],
    );
    const user1ExercisesInDb = await Exercise.find({ user: user1.id });
    const user2ExercisesInDb = await Exercise.find({ user: user2.id });
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[0].name],
      user1ExercisesInDb.map((exercise) => exercise.id),
      testData.initialUsers[0].username,
    );
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[1].name],
      user2ExercisesInDb.map((exercise) => exercise.id),
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
  });
  describe("When logged in as the owner of some of the user exercises", () => {
    beforeAll(async () => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a set with user exercises owned by the logged in user can be added by a POST request to /api/sets", async () => {
      const setsAtStart = await Set.find({});
      const loggedInUser = await testHelpers.getUserByJwtToken(tokens[0]);
      const availableExercises = await Exercise.find({ user: loggedInUser.id });
      const workout = await Workout.findOne({ user: loggedInUser.id });
      await request
        .post("/api/sets")
        .send({
          number: 1,
          reps: 1,
          weight: 1,
          rest: 1,
          workout: workout.id,
          exercise: availableExercises[0].id,
          type: "regular",
        })
        .expect(201);
      const setsAtEnd = await Set.find({});
      expect(setsAtEnd.length).toBe(setsAtStart.length + 1);
    });
    it("a set with user exercises not owned by the logged in user can't be added by a POST request to /api/sets", async () => {
      const setsAtStart = await Set.find({});
      const notLoggedInUser = await testHelpers.getUserByJwtToken(tokens[1]);
      const unavailableExercises = await Exercise.find({
        user: notLoggedInUser.id,
      });
      const workout = await Workout.findOne({ user: notLoggedInUser.id });
      await request
        .post("/api/sets")
        .send({
          number: 1,
          reps: 1,
          weight: 1,
          rest: 1,
          workout: workout.id,
          exercise: unavailableExercises[0].id,
        })
        .expect(404);
      const setsAtEnd = await Set.find({});
      expect(setsAtEnd.length).toBe(setsAtStart.length);
    });
  });
});
