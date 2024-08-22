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
  mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("When there are users in the database", () => {
  let token;
  beforeEach(async () => {
    await User.deleteMany({});
    await testHelpers.addUsersToDbAndGetTokens(testData.initialUsers);
  });
  describe("When logged in", () => {
    beforeEach(async () => {
      token = await testHelpers.getTokenByUsername(testData.initialUsers[0].username);
      request.set("Authorization", `Bearer ${token}`);
    });
    it("a GET request to /api/users returns 401 unauthorized", async () => {
      await request
        .get("/api/users")
        .expect(401);
    });
    it("a PUT request to /api/users/:id updates the corresponding user's name and/or username", async () => {
      const userToUpdate = await User.findOne({ username: testData.initialUsers[0].username });
      const res = await request
        .put(`/api/users/${userToUpdate.id}`)
        .send({
          name: "updatedName",
          username: "updatedUsername",
        })
        .expect(200);
      expect(res.body.name).toBe("updatedName");
      expect(res.body.username).toBe("updatedUsername");
      const userAtEnd = await User.findById(userToUpdate.id);
      expect(userAtEnd.name).toBe("updatedName");
      expect(userAtEnd.username).toBe("updatedUsername");
    });
    it("a PUT request to /api/users/:id/changePassword can be used to update the corresponding user's password", async () => {
      const userToUpdate = await User.findOne({ username: testData.initialUsers[0].username });
      const oldPassword = testData.initialPasswords[0];
      const newPassword = "updatedPassword";
      await request
        .put(`/api/users/${userToUpdate.id}/changePassword`)
        .send({
          oldPassword,
          newPassword,
        })
        .expect(200);
      await request
        .post("/api/login")
        .send({
          username: userToUpdate.username,
          password: newPassword,
        })
        .expect(200);
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
    it("trying to add a user with a username already in use returns 400 bad request", async () => {
      await request
        .post("/api/users")
        .send({
          username: testData.initialUsers[0].username,
          name: "testUser",
          password: "testPassword",
        })
        .expect(400);
    });
    it("a GET request to /api/users returns 401 unauthorized", async () => {
      await request
        .get("/api/users")
        .expect(401);
    });
  });
});
