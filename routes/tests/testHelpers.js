require("dotenv").config();
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const User = require("../../models/user");
const Set = require("../../models/set");
const Exercise = require("../../models/exercise");
const Routine = require("../../models/routine");
const Workout = require("../../models/workout");

const addUsersToDbAndGetTokens = async (usersToAdd) => {
  const usersToSave = usersToAdd.map((user) => new User(user));
  const savedUsers = await Promise.all(usersToSave.map((user) => user.save()));
  const tokens = savedUsers.map((user) => jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
    expiresIn: "10h",
  }));
  return tokens;
};

const getTokenFromFirstUserInDb = async () => {
  const usersInDb = (await User.find({})).toSorted();
  const token = jwt.sign(usersInDb[0].toJSON(), process.env.JWT_SECRET, {
    expiresIn: "10h",
  });
  return token;
};

const addAnonymousExercisesToDb = async (exercisesToAdd) => {
  const exercisesToSave = exercisesToAdd.map(
    (exercise) => new Exercise(exercise),
  );
  await Promise.all(
    exercisesToSave.map((exerciseToSave) => exerciseToSave.save()),
  );
};

const addUserExercisesToDb = async (exercisesToAdd, userToOwnExercises) => {
  const owner = await User.findOne({ username: userToOwnExercises.username });
  const exercisesToSave = exercisesToAdd.map(
    (exercise) => new Exercise({
      ...exercise,
      user: owner.id,
    }),
  );
  await Promise.all(
    exercisesToSave.map((exerciseToSave) => exerciseToSave.save()),
  );
};

const getIdsOfExercisesInDbByNames = async (exerciseNames) => {
  const foundExercises = await Promise.all(
    exerciseNames.map((name) => Exercise.findOne({ name })),
  );
  return foundExercises.map((exercise) => exercise.id);
};

const getUserByJwtToken = async (token) => {
  const decodedUser = jwt.decode(token);
  const foundUser = await User.findOne({ username: decodedUser.username });
  return foundUser;
};

const addRoutinesToDb = async (namesOfRoutinesToAdd, exerciseIds, usernameToOwnRoutines) => {
  const owner = await User.findOne({ username: usernameToOwnRoutines });
  const numberOfAvailableExercises = exerciseIds.length;
  const numberOfExercisesInEachRoutine = Math.floor(
    numberOfAvailableExercises / namesOfRoutinesToAdd.length,
  );
  const exercisesForEachRoutine = _.chunk(exerciseIds, numberOfExercisesInEachRoutine);
  const routinesToSave = namesOfRoutinesToAdd.map((nameOfRoutine, index) => new Routine({
    name: nameOfRoutine,
    exercises: exercisesForEachRoutine[index],
    user: owner.id,
  }));
  await Promise.all(routinesToSave.map((routineToSave) => routineToSave.save()));
};

const addWorkoutsToDb = async (numberOfWorkouts, routineName, usernameToOwnWorkouts) => {
  const owner = await User.findOne({ username: usernameToOwnWorkouts });
  const routine = await Routine.findOne({ name: routineName });
  const workoutsToSave = Array(numberOfWorkouts).fill(null).map(() => new Workout({
    routine: routine.id,
    user: owner.id,
  }));
  await Promise.all(workoutsToSave.map((workout) => workout.save()));
};

const addSetToDb = async (setObj, usernameToOwnSet, workoutId, exerciseId) => {
  const owner = await User.findOne({ username: usernameToOwnSet });
  const setToAdd = new Set({
    ...setObj,
    workout: workoutId,
    exercise: exerciseId,
    user: owner,
  });
  await setToAdd.save();
};

module.exports = {
  addUsersToDbAndGetTokens,
  addAnonymousExercisesToDb,
  getTokenFromFirstUserInDb,
  addRoutinesToDb,
  addUserExercisesToDb,
  getIdsOfExercisesInDbByNames,
  addWorkoutsToDb,
  getUserByJwtToken,
  addSetToDb,
};
