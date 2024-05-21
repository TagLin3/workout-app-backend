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

describe("When there are users in the database", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await testHelpers.addUsersToDbAndGetTokens(testData.initialUsers);
  });
  it("a POST request to /api/login with the correct credentials returns a working token", async () => {
    const res = await request
      .post("/api/login")
      .send({
        username: testData.initialUsers[0].username,
        password: "password1",
      })
      .expect(200);
    request.set("Authorization", `Bearer ${res.body.token}`);
    await request
      .get("/api/exercises")
      .expect(200);
  });
  it("logging in with an incorrect password or as a nonexistent user returns 401 unauthorized and both return the same error message", async () => {
    const incorrectPasswordRes = await request
      .post("/api/login")
      .send({
        username: testData.initialUsers[0].username,
        password: "wrongPassword",
      })
      .expect(401);
    const nonexistentUserRes = await request
      .post("/api/login")
      .send({
        username: "nonexistentUser",
        password: "password1",
      })
      .expect(401);
    expect(nonexistentUserRes.body).toEqual(incorrectPasswordRes.body);
  });
});
