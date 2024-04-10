require("dotenv").config();
const mongoose = require("mongoose");
const supertest = require("supertest");
const jwt = require("jsonwebtoken");
const defaults = require("superagent-defaults");
const app = require("../../app");
const User = require("../../models/user");
const testData = require("./testData");
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
    const usersToSave = testData.initialUsers.map((user) => new User(user));
    await Promise.all(usersToSave.map((user) => user.save()));
  });
  describe("When logged in", () => {
    beforeAll(() => {
      const token = jwt.sign({
        name: testData.initialUsers.map((user) => user.name)[0],
        username: testData.initialUsers.map((user) => user.username)[0],
      }, process.env.JWT_SECRET);
      request.set("Authorization", `Bearer ${token}`);
    });
    it("those users are returned by GET /api/users", async () => {
      const res = await request
        .get("/api/users")
        .expect(200);
      const expectedUsernames = testData.initialUsers.map((user) => user.username);
      const recievedUsernames = res.body.map((user) => user.username)
        .toSorted();
      expect(recievedUsernames).toEqual(expectedUsernames);
    });
  });
  describe("When not logged in", () => {
    beforeAll(() => {
      request.set("Authorization", "");
    });
    it("a new user can be added by a POST request to /api/users", async () => {
      await request
        .post("/api/users")
        .send({
          name: "user4",
          username: "username4",
          password: "password4",
        })
        .expect(201);
      const usersInDb = await User.find({});
      const usernamesInDb = usersInDb.map((user) => user.username);
      expect(usernamesInDb.length).toBe(testData.initialUsers.length + 1);
    });
    it("a GET request to /api/users returns 401 unauthorized", async () => {
      await request.get("/api/users").expect(401);
    });
  });
});
