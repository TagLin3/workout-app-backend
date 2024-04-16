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

const addExercisesToDb = async (exercisesToAdd) => {
  const exercisesToSave = exercisesToAdd.map(
    (exercise) => new Exercise(exercise),
  );
  await Promise.all(
    exercisesToSave.map((exerciseToSave) => exerciseToSave.save()),
  );
};

const addRoutinesToDb = async (namesOfRoutinesToAdd) => {
  const usersInDb = await User.find({});
  const firstUserInDb = usersInDb.toSorted()[0];
  const availableExercises = (await Exercise.find({})).toSorted();
  const idsOfAvailableExercises = availableExercises.map((exercise) => exercise.id);
  const numberOfAvailableExercises = availableExercises.length;
  const numberOfExercisesInEachRoutine = Math.floor(
    numberOfAvailableExercises / namesOfRoutinesToAdd.length,
  );
  const exercisesForEachRoutine = _.chunk(idsOfAvailableExercises, numberOfExercisesInEachRoutine);
  console.log(exercisesForEachRoutine);
  const routinesToSave = namesOfRoutinesToAdd.map((nameOfRoutine, index) => new Routine({
    name: nameOfRoutine,
    exercises: exercisesForEachRoutine[index],
    user: firstUserInDb.id,
  }));
  await Promise.all(routinesToSave.map((routineToSave) => routineToSave.save()));
  console.log(await Routine.find({}).populate("exercises"));
};

module.exports = {
  addOneUserToDbAndGetToken, addExercisesToDb, getTokenFromFirstUserInDb, addRoutinesToDb,
};
