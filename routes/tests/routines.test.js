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
  mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are users, anonymous exercises and routines in the database", () => {
  let tokenOfRoutineOwner;
  beforeAll(async () => {
    await Exercise.deleteMany({});
    await User.deleteMany({});
    await testHelpers.addAnonymousExercisesToDb(testData.initialAnonymousExercises);
    [tokenOfRoutineOwner] = await testHelpers.addUsersToDbAndGetTokens(
      testData.initialUsers.slice(0, 2),
    );
  });
  beforeEach(async () => {
    await Routine.deleteMany({});
    const exerciseIds = await testHelpers.getIdsOfExercisesInDbByNames(
      testData.initialAnonymousExercises.map((exercise) => exercise.name),
    );
    await testHelpers.addRoutinesToDb(
      testData.initialRoutines.slice(0, 2).map((routine) => routine.name),
      exerciseIds.slice(0, 6),
      testData.initialUsers[0].username,
    );
    await testHelpers.addRoutinesToDb(
      [testData.initialRoutines[2].name],
      exerciseIds.slice(6, 10),
      testData.initialUsers[1].username,
    );
  });
  describe("When logged in as the owner of some of the routines", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${tokenOfRoutineOwner}`);
    });
    it("a GET request to /api/routines returns the routines owned by the logged in user but not any routines owned by another user", async () => {
      const res = await request
        .get("/api/routines")
        .expect(200);
      const recievedRoutines = res.body
        .map((routine) => {
          const exerciseNames = routine.exercises.map(
            (exercise) => ({ name: exercise.exercise.name }),
          );
          return {
            name: routine.name,
            exercises: exerciseNames,
          };
        })
        .toSorted((a, b) => a.name.localeCompare(b.name));
      expect(recievedRoutines).toContainEqual(testData.initialRoutines[0]);
      expect(recievedRoutines).toContainEqual(testData.initialRoutines[1]);
      expect(recievedRoutines).not.toContainEqual(testData.initialRoutines[2]);
    });
    it("a GET request to /api/routines/:id returns the correct routine", async () => {
      const loggedInUser = await testHelpers.getUserByJwtToken(tokenOfRoutineOwner);
      const routineToGet = await Routine.findOne({ user: loggedInUser.id });
      const res = await request
        .get(`/api/routines/${routineToGet.id}`)
        .expect(200);
      expect(res.body.id).toEqual(routineToGet.id);
    });
    it("a routine is added by a POST request to /api/routines", async () => {
      const routinesAtStart = await Routine.find({});
      const exercisesInDb = await Exercise.find({});
      await request
        .post("/api/routines")
        .send({
          name: "testRoutine",
          exercises: exercisesInDb.map((exercise) => ({
            exercise: exercise.id,
            repRange: "8-12",
            amountOfSets: 3,
            type: "regular",
          })),
        })
        .expect(201);
      const routinesInDb = await Routine.find({});
      expect(routinesInDb.length).toBe(routinesAtStart.length + 1);
    });
    it("a routine containing an invalid rep range can not be added", async () => {
      const routinesAtStart = await Routine.find({});
      const exercisesInDb = await Exercise.find({});
      await request
        .post("/api/routines")
        .send({
          name: "testRoutine",
          exercises: exercisesInDb.map((exercise) => ({
            exercise: exercise.id,
            repRange: "2-1",
            amountOfSets: 3,
            type: "regular",
          })),
        })
        .expect(400);
      const routinesInDb = await Routine.find({});
      expect(routinesInDb.length).toBe(routinesAtStart.length);
    });
    it("a DELETE request to /api/routines/:id return 400 bad request if the corresponding routine is active", async () => {
      const routineToDelete = await Routine.findOne(
        { user: (await testHelpers.getUserByJwtToken(tokenOfRoutineOwner)).id },
      );
      await request
        .delete(`/api/routines/${routineToDelete.id}`)
        .expect(400);
    });
    it("a PUT request to /api/routines/:id/toggleActivity toggles the activity of a routine", async () => {
      const routineToUpdate = await Routine.findOne(
        { name: testData.initialRoutines[0].name },
      );
      await request
        .put(`/api/routines/${routineToUpdate.id}/toggleActivity`)
        .expect(200);
      const routineToUpdateAtEnd = await Routine.findOne(
        { name: testData.initialRoutines[0].name },
      );
      expect(routineToUpdateAtEnd.active).toBe(!routineToUpdate.active);
    });
    describe("when one of the routines is inactive", () => {
      beforeEach(async () => {
        await Routine.findOneAndUpdate(
          { name: testData.initialRoutines[0].name },
          { active: false },
        );
      });
      it("a GET request to /api/routines?inactiveOnly returns only the inactive routine", async () => {
        const res = await request
          .get("/api/routines?inactiveOnly")
          .expect(200);
        const recievedRoutineNames = res.body.map((routine) => routine.name);
        expect(recievedRoutineNames).toContainEqual(testData.initialRoutines[0].name);
        expect(recievedRoutineNames).not.toContainEqual(testData.initialRoutines[1].name);
      });
      it("a GET request to /api/routines?activeOnly returns only the active routines", async () => {
        const res = await request
          .get("/api/routines?activeOnly")
          .expect(200);
        const recievedRoutineNames = res.body.map((routine) => routine.name);
        expect(recievedRoutineNames).toContainEqual(testData.initialRoutines[1].name);
        expect(recievedRoutineNames).not.toContainEqual(testData.initialRoutines[0].name);
      });
      it("a DELETE request to /api/routines/:id deletes the corresponding inactive routine", async () => {
        const routineToDelete = await Routine.findOne({ name: testData.initialRoutines[0].name });
        await request
          .delete(`/api/routines/${routineToDelete.id}`)
          .expect(204);
        const routinesAfterDeletion = await Routine.find({});
        expect(routinesAfterDeletion).not.toContainEqual(routineToDelete);
      });
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

describe("When there are users who own user exercises in the database", () => {
  let tokens;
  beforeAll(async () => {
    await User.deleteMany({});
    tokens = await testHelpers.addUsersToDbAndGetTokens(testData.initialUsers.slice(0, 2));
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
  beforeEach(async () => {
    await Routine.deleteMany({});
  });
  describe("When logged in", () => {
    beforeAll(() => {
      request.set("Authorization", `Bearer ${tokens[0]}`);
    });
    it("a routine with user exercises owned by the logged in user can be added by a POST request to /api/routines", async () => {
      const foundUsers = await User.find({ username: testData.initialUsers[0].username });
      const user1ExercisesInDb = await Exercise.find({ user: foundUsers[0].id });
      const exercisesToAdd = user1ExercisesInDb.map((exercise) => ({
        exercise: exercise.id,
        repRange: "6-10",
        amountOfSets: 3,
        type: "regular",
      }));
      const res = await request
        .post("/api/routines")
        .send({
          name: "testRoutineWithUserExercises",
          exercises: exercisesToAdd,
        })
        .expect(201);
      const recievedRoutine = {
        name: res.body.name,
        exercises: res.body.exercises.map((exercise) => ({
          exercise: exercise.exercise,
          repRange: exercise.repRange,
          amountOfSets: exercise.amountOfSets,
          type: exercise.type,
        })),
      };
      expect(recievedRoutine).toEqual({
        name: "testRoutineWithUserExercises",
        exercises: exercisesToAdd,
      });
    });
    it("a routine with user exercises not owned by the logged in user can't be added by a POST request to /api/routines", async () => {
      const routinesAtStart = await Routine.find({});
      const foundUsers = await User.find({ username: testData.initialUsers[1].username });
      const user2ExercisesInDb = await Exercise.find({ user: foundUsers[0].id });
      const exercisesToAdd = user2ExercisesInDb.map((exercise) => ({
        exercise: exercise.id,
        repRange: "6-10",
      }));
      await request
        .post("/api/routines")
        .send({
          name: "shouldNotWork",
          exercises: exercisesToAdd,
        })
        .expect(404);
      const routinesAtEnd = await Routine.find({});
      expect(routinesAtStart.length).toBe(routinesAtEnd.length);
    });
  });
});
