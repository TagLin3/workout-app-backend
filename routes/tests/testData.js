require("dotenv").config();
const _ = require("lodash");

const initialUsers = [
  {
    name: "user1",
    username: "username1",
    passwordHash: "$2a$10$ybgGsZKPwCooa02sMqLxreBNQJLzr4j4B4sDMXi0Yc1m1/Ugqj382",
  },
  {
    name: "user2",
    username: "username2",
    passwordHash: "$2a$10$OlPuC8Q5oF8bCxhVD99Te.OWdbip2sntHiLK7Vh4oV3ldr5WTpRaO",
  },
  {
    name: "user3",
    username: "username3",
    passwordHash: "$2a$10$sMi8jT9g0UOBfd4EJBfiJuA0t5s4PA9RmGJO3QDamekiqzjAop7y.",
  },
];

const userToOwnRoutines = initialUsers[0];

const initialExercises = [
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

const numberOfRoutines = 3;

const numberOfExercisesInEachRoutine = Math.floor(
  initialExercises.length / numberOfRoutines,
);
const exercisesForEachRoutine = _.chunk(initialExercises, numberOfExercisesInEachRoutine);

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

module.exports = {
  userToOwnRoutines, initialExercises, initialRoutines, initialUsers,
};
