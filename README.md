Frontend repository and work log at https://github.com/TagLin3/workout-app-frontend

# Workout app backend documentation:

This is the backend for my gym workout planning and logging application. It is used to plan workouts for completion in the gym and to track progress on different exercises.

To run the application

## Data types:

### Exercises:

Every user has access to the default public exercises as well as the exercises they themselves have created. For every exercise, the application currently only saves the name of the exercise. Exercise are referenced to in [workout routines](#workout-routines) and [sets](#sets). An exercise is of the following form:

```
{
  "name": "bench press",
  "user": "(id of the user that created the exercise (the default exercises don't have this field))",
  "id": "(id of the exercise)"
}
```

### Workout routines:

A workout routine, or simply a routine, is essentially just a collection of exercises with instructions on how to do them. For example, a routine could be a push day or an upped body day. Routines can be active, meaning you are actively completing new workouts based on it, or inactive, meaning you are not. This is indicated by the "active" field Routines are structured as objects that are of the following form:

```
{
  "name": "push day",
  "user": "(id of the user that created the routine)",
  "id": "(id of the routine)",
  "active": true,
  "exercises": [
    {
      "exercise": "(id of an exercise)",
      "repRange": "6-10",
      "amountOfSets": "3",
      "type": "regular"
    },
    {
      "exercise": "(id of another exercise)",
      "repRange": "8-12",
      "amountOfSets": "3",
      "type": "regular"
    },
    {
      "exercise": "(id of a third exercise)",
      "repRange": "10-15",
      "amountOfSets": "3",
      "amountOfDropSets": "2",
      "type": "dropset"
    }
  ]
}
```

Currently drop sets are the only form of intensity technique available.

### Workouts:

A workout is a single completion of a routine. For example, when you would do your push day, you would save that single workout as a "workout" in the application. A workout is of the following form:

```
{
  "id": "(id of the workout)"
  "routine": "(id of the routine that the workout is based on)",
  "date": "2024-08-14T04:51:09.702+00:00",
  "user": "(id of the user that did the workout)"
}
```

### Sets:

A set is a single completion of an exercise in a workout. For example, when you do 60 kg on the bench press for 12 reps in a row, you would save that as a single set. A set's number is used to determine the order of sets in a single exercise in a workout. The first set has the number 1, the second has 2 etc. Rest time is usually marked as rest after a set in seconds. For each set, a free-form note can also be saved. A regular set is of the following form:

```
{
  "id": "(id of the set)",
  "exercise": "(id of the exercise that the set was done on)",
  "workout": "(id of the workout that the set was a part of)",
  "user": "(id of the user that did the set)",
  "date": "2024-08-14T04:51:34.026+00:00",
  "type": "regular",
  "number": 1,
  "reps": 12,
  "weight": 60,
  "rest": 120,
  "note": "Last rep was a bit fast on the eccentric but ok enough",
}
```

#### Drop sets:

Each drop set is saved as an individual set. Drop sets have the additional field "dropSetNumber". Each drop set that is performed in a row has the same number but a different drop set number. Like regular set numbers, drop set numbers also count up from 1.

## Routes:

### /api/users

#### POST /api/users

One of the three paths in the application that doesn't require authorization. Used to create a new user. Request body must be formatted in JSON and contain the fields "username", "name", and "password", the contents of which are somewhat self explanatory. Your username needs to be unique while your name doesn't. All of the fields can contain any characters. Returns the new users username, id and name formatted in JSON. Use the username and the password you just picked to login by following the instructions at [POST /api/login](#post-apilogin)

#### GET /api/users

This route returns all of the users formatted as a JSON list. Only available to the admin user.

#### GET /api/users/:id

This route returns the information for a single user whose formatted as a JSON object. This includes the name, username and id of the user. The jwt token in the authorization header must correspond to the user that you are trying to look up.

#### PUT /api/users/:id

This route is used to change a user's name and username. In the request body, formatted in JSON, you can include the fields "name", "username" or both. The jwt token in the authorization header must correspond to the user that you are trying to update. For updating the password, refer to [PUT /api/users/:id/changePassword](#put-apiusersidchangepassword)

#### PUT /api/users/:id/changePassword

This route is used to change a user's password. In the request body, please include the fields "oldPassword" and "newPassword", containing the current password for the user and the password that you wish to change to. Since the request body requires the user's current password, this route doens't check for the authorization header.

### /api/login

#### POST /api/login

This route is used to log in. Format the request body in JSON and include your username in the field "username" and password in the field "password". Upon succesful authentication returns the user's username, name, id, a jwt token used in subsequent requests for the authorization field, and a date that the token expires at.

### /api/exercises

All of the /api/exercises routes require the authorization header. Any user can look up exercises and see the default exercises available to everyone but the user associated with jwt token in the authorization header must always match the "user" field in the exercise if it is trying to be edited or deleted.

#### GET /api/exercises

Returns all of the exercises that are available to the user, formatted as a JSON list. Refer to [exercises](#exercises) to see how these are formatted. The returned exercises include the default exercises available to everyone and the exercises the user has created themselves.

#### POST /api/exercises

Used to add a new exercise. The request body must be formatted in JSON and contain one field, "name", which contains the name of the new exercise. The "user" and "id" fields will be figured out by the server. This exercise will only be available to the user associated with the jwt token in the authorization header.

#### PUT /api/exercises

Used to edit a set. All fields of the set can be edited except for the "user" and "id" fields. Currently, this only leaves the "name" field to be edited. Returns the edited exercise.

#### DELETE /api/exercises

Used to delete an exercise. Deleting an exercise will delete all of the routines that use the exercise. This will in turn delete all of the workouts that are based on those routines which will also cause all of the sets done on those workouts to be deleted.

### /api/routines

All of the /api/routines routes require the authorization header. The user associated with jwt token in the authorization header must alway match the "user" field in the routine that is trying to be looked up, edited or deleted.

#### GET /api/routines

Returns all of the user's workout routines, formatted as a JSON list. Refer to [workout routines](#workout-routines) to see how these are formatted. Can also include the query parameters `?inactiveOnly` and `?activeOnly` to only fetch routines that are active or inactive.

#### GET /api/routines/:id

Returns a single routine with the exercises populated. Similar to how the example routine at [workout routines](#workout-routines) is formatted, except for the exercises being populated with objects similar to the example exercise at [exercises](#exercises).

#### POST /api/routines

Used to add a routine. Request body must be formatted as a JSON closely resembling the example routine seen at [workout routines](#workout-routines) the exception being that when adding a routine, the "id" and "user" fields shouldn't be included at all and the "active" field is optional, with the default value being true. Also when creating a routine, users can only use exercises they have access to, ie. the default exercises accessible to everyone or the exercises they themselves have created.

#### PUT /api/routines/:id/toggleActivity

Used to change the "active" status of a routine. Will always set the active status as different to what it was.

#### DELETE /api/routines/:id

Used to delete a routine. Deleting a routine will also delete all the workouts based on it and all the sets done in those workouts.

### /api/workouts

All of the /api/workouts routes require the authorization header. The user associated with jwt token in the authorization header must alway match the "user" field in the workout that is trying to be looked up or deleted.

#### GET /api/workouts

Returns all of the user's workouts, formatted as a JSON list. The workouts are formatted similarly to the example workout at [workouts](#workouts) except for the "routine" property being populated and containing the routine as an object.

#### GET /api/workouts/:id

Returns a single workout with the routine populated. Accepts query parameters ?inlcudeSets, ?includeExercises or both. The returned object is similar to the objects returned by [GET /api/workouts](#get-apiworkouts), except that if the query parameter ?includeExercises is present the exercises in the routine are populated similar to [GET /api/routines/:id](#get-apiroutinesid) and if the query parameter ?inclueSets is present the workout also contains a property "sets" that contains a list of all the sets completed in the workout. This list is similar to the result of [GET /api/sets](#get-apisets).

#### POST /api/workouts

Used to add a workout. Request body must be formatted as a JSON closely resembling the example workout seen at [workouts](#workouts) the exception being that when adding a workout, the "id" and "user" fields shouldn't be included at all and "date" is optional, with the default value being the date that the workout is saved to the db (ie. very close to the date of the request). A workout has to be based on a routine that the user has created and that is active.

#### DELETE /api/workouts/:id

Used to delete a workout. Deleting a workout also deletes all the sets done in that workout.

### /api/sets

All of the /api/sets routes require the authorization header. The user associated with jwt token in the authorization header must alway match the "user" field in the set that is trying to be looked up, edited or deleted.

#### GET /api/sets

Returns all of the user's sets, formatted as a JSON list. The sets are formatted similarly to the example set at [sets](#sets) by default. Accepts query parameters ?inclueExercises, ?filterByExercise or both. In the precence of ?inluceExercises, the sets' "exercise" fields will be populated with exercise objects similar to the example exercise at [exercises](#exercises). Setting ?filterByExercise to the id of some exercise will return only the sets done on that exercise.

#### POST /api/sets

Used to add a set. Request body must be formatted as a JSON closely resembling the example set seen at [sets](#sets) the exception being that when adding a set, the "id" and "user" fields shouldn't be included at all, "note" is optional and "date" is optional, with the default value being the date that the set is saved to the db (ie. very close to the date of the request). Also when adding drop sets, set the field "dropSetNumber" to the proper value, as explained in [drop sets](#drop-sets). A set has to be done on a workout that the user has created.

#### PUT /api/sets/:id

Used to edit a set. All fields of the set can be edited except for the "user", "id", "workout" and "exercises" fields. Returns the edited set.

#### DELETE /api/sets/:id

Used to delete a set.
