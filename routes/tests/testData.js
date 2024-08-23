require("dotenv").config();
const _ = require("lodash");

const initialPasswords = [
  "password1",
  "password2",
  "password3",
];

const initialUsers = [
  {
    name: "user1",
    username: "username1",
    passwordHash: "$2b$10$KXflHBKSjmjt3gnj/o/mOOlPHHJVzqsA6j6txJsWC0PwaxPbK6iE.",
  },
  {
    name: "user2",
    username: "username2",
    passwordHash: "$2b$10$er8U2QOGdC8GRpd8Md6EMeRIrW2uOWgR4IKkOnVg1ed0lnE8B3gjO",
  },
  {
    name: "user3",
    username: "username3",
    passwordHash: "$2b$10$wlfVN0vJhRq/BwZ2rAGTPOxjZg/LE3MZ7gWiFKZRY6cfpRnJpCgjm",
  },
];

const initialAnonymousExercises = [
  {
    name: "exercise1",
  },
  {
    name: "exercise2",
  },
  {
    name: "exercise3",
  },
  {
    name: "exercise4",
  },
  {
    name: "exercise5",
  },
  {
    name: "exercise6",
  },
  {
    name: "exercise7",
  },
  {
    name: "exercise8",
  },
  {
    name: "exercise9",
  },
];

const initialUserExercisesForUser1 = [
  {
    name: "user1Exercise1",
  },
  {
    name: "user1Exercise2",
  },
];

const initialUserExercisesForUser2 = [
  {
    name: "user2Exercise1",
  },
  {
    name: "user2Exercise2",
  },
];

const numberOfRoutines = 3;

const numberOfExercisesInEachRoutine = Math.floor(
  initialAnonymousExercises.length / numberOfRoutines,
);
const exercisesForEachRoutine = _.chunk(initialAnonymousExercises, numberOfExercisesInEachRoutine);

const initialRoutines = [
  {
    name: "routine1",
    exercises: exercisesForEachRoutine[0],
  },
  {
    name: "routine2",
    exercises: exercisesForEachRoutine[1],
  },
  {
    name: "routine3",
    exercises: exercisesForEachRoutine[2],
  },
];

const initialSets = [
  {
    number: 1,
    reps: 8,
    weight: 60,
    rest: 120,
    note: "testnote",
    type: "regular",
  },
  {
    number: 1,
    reps: 15,
    weight: 20,
    rest: 120,
    note: "testnote2",
    type: "regular",
  },
  {
    number: 1,
    reps: 7,
    weight: 60,
    rest: 120,
    note: "testnote3",
    type: "regular",
  },
];

module.exports = {
  initialAnonymousExercises,
  initialRoutines,
  initialUsers,
  initialPasswords,
  initialUserExercisesForUser1,
  initialUserExercisesForUser2,
  initialSets,
};
