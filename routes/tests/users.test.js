require("dotenv").config();
const mongoose = require("mongoose");
const supertest = require("supertest");
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
      request.set("Authorization", `Bearer ${testData.token}`);
    });
    it("users are returned by a GET request to /api/users", async () => {
      const res = await request
        .get("/api/users")
        .expect(200);
      const expectedUsernames = testData.initialUsers.map((user) => user.username);
      const recievedUsernames = res.body.map((user) => user.username).toSorted();
      expect(recievedUsernames).toEqual(expectedUsernames);
    });
  });
  describe("When not logged in", () => {
    beforeAll(() => {
      request.set("Authorization", "");
    });
    it("a user is added by a POST request to /api/users", async () => {
      await request
        .post("/api/users")
        .send({
          name: "testUser",
          username: "testUsername",
          password: "testPassword",
        })
        .expect(201);
      const usersInDb = await User.find({});
      expect(usersInDb.length).toBe(testData.initialUsers.length + 1);
    });
    it("a GET request to /api/users returns 401 unauthorized", async () => {
      await request
        .get("/api/users")
        .expect(401);
    });
  });
});
