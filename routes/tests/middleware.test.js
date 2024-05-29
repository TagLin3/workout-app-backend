require("dotenv").config();
const mongoose = require("mongoose");
const supertest = require("supertest");
const defaults = require("superagent-defaults");
const app = require("../../app");
const User = require("../../models/user");
const testData = require("./testData");
const testHelpers = require("./testHelpers");
const request = defaults(supertest(app));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

it("using an invalid authorization token for requests returns 401 unauthorized with the correct error message", async () => {
  request.set("Authorization", "Bearer invalidToken");
  const res = await request
    .get("/api/exercises")
    .expect(401);
  expect(res.body).toEqual({ error: "Invalid authorization token" });
});

it("using an expired authorization token for requests returns 401 unauthorized with the correct error message", async () => {
  const user = new User(testData.initialUsers[0]);
  const savedUser = await user.save();
  const expiredToken = await testHelpers.createExpiredToken(savedUser.toJSON());
  request.set("Authorization", `Bearer ${expiredToken}`);
  const res = await request
    .get("/api/exercises")
    .expect(401);
  expect(res.body).toEqual({ error: "Authorization token expired" });
});
