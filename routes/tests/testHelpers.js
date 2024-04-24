require("dotenv").config();
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const User = require("../../models/user");
const Exercise = require("../../models/exercise");
const Routine = require("../../models/routine");

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

const addRoutinesToDb = async (namesOfRoutinesToAdd, userToOwnRoutines) => {
  const owner = await User.findOne({ username: userToOwnRoutines.username });
  const availableExercises = (await Exercise.find({})).toSorted();
  const idsOfAvailableExercises = availableExercises.map((exercise) => exercise.id);
  const numberOfAvailableExercises = availableExercises.length;
  const numberOfExercisesInEachRoutine = Math.floor(
    numberOfAvailableExercises / namesOfRoutinesToAdd.length,
  );
  const exercisesForEachRoutine = _.chunk(idsOfAvailableExercises, numberOfExercisesInEachRoutine);
  const routinesToSave = namesOfRoutinesToAdd.map((nameOfRoutine, index) => new Routine({
    name: nameOfRoutine,
    exercises: exercisesForEachRoutine[index],
    user: owner.id,
  }));
  await Promise.all(routinesToSave.map((routineToSave) => routineToSave.save()));
};

module.exports = {
  addUsersToDbAndGetTokens,
  addAnonymousExercisesToDb,
  getTokenFromFirstUserInDb,
  addRoutinesToDb,
  addUserExercisesToDb,
};
