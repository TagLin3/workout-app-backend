require("dotenv").config();
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const User = require("../../models/user");
const Exercise = require("../../models/exercise");
const Routine = require("../../models/routine");

const addOneUserToDbAndGetToken = async (userToAdd) => {
  const userToSave = new User(userToAdd);
  const savedUser = await userToSave.save();
  const token = jwt.sign(savedUser.toJSON(), process.env.JWT_SECRET, {
    expiresIn: "10h",
  });
  return token;
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
  addOneUserToDbAndGetToken, addAnonymousExercisesToDb, getTokenFromFirstUserInDb, addRoutinesToDb,
};
