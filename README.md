# Workout app backend documentation:

## /api/users

### POST /api/users

One of the three paths in the application that doesn't require authorization. Used to create a new user. Request body must be formatted in JSON and contain the fields "username", "name", and "password", the contents of which are somewhat self explanatory. Your username needs to be unique while your name doesn't. All of the fields can contain any characters. Returns the new users username, id and name formatted in JSON. Use the username and the password you just picked to login by following the instructions at [POST /api/login](#post-apilogin)

### GET /api/users

This route returns all of the users formatted as a JSON list. Only available to the admin user.

### GET /api/users/:id

This route returns the information for a single user whose formatted as a JSON object. This includes the name, username and id of the user. The jwt token in the authorization header must correspond to the user that you are trying to look up.

### PUT /api/users/:id

This route is used to change a user's name and username. In the request body, formatted in JSON, you can include the fields "name", "username" or both. The jwt token in the authorization header must correspond to the user that you are trying to update. For updating the password, refer to [PUT /api/users/:id/changePassword](#put-apiusersidchangepassword)

### PUT /api/users/:id/changePassword

This route is used to change a user's password. In the request body, please include the fields "oldPassword" and "newPassword", containing the current password for the user and the password that you wish to change to. Since the request body requires the user's current password, this route doens't check for the authorization header.

## /api/login

### POST /api/login

This route is used to log in. Format the request body in JSON and include your username in the field "username" and password in the field "password". Upon succesful authentication returns the user's username, name, id, a jwt token used in subsequent requests for the authorization field, and a date that the token expires at.

## /api/exercises

### GET /api/exercises

Returns all of the exercises that are available to the user, formatted as a JSON list. These include the default exercises available to everyone and the exercises the user has created themselves.

### POST /api/exercises

Used to add a new exercise. The request body must be formatted in JSON and contain one field, "name", which contains the name of the new exercise. This exercise will only be available to the user associated with the jwt token in the authorization header.

## /api/routines

### GET /api/routines

### GET /api/routines/:id

### POST /api/routines

### PUT /api/routines/:id/toggleActivity

### DELETE /api/routines/:id

## /api/workouts

### GET /api/workouts

### GET /api/workouts/:id

### POST /api/workouts

### DELETE /api/workouts/:id

## /api/sets

### GET /api/sets

### POST /api/sets

### PUT /api/sets/:id

### DELETE /api/sets/:id

Frontend repository and work log at https://github.com/TagLin3/workout-app-frontend
