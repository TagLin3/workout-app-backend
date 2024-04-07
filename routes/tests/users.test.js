const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/user");
const testData = require("./testData");
require("dotenv").config();

beforeEach(() => {
  mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterEach(() => {
  mongoose.connection.close();
});

describe("When there are users in the database", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const usersToSave = testData.initialUsers.map((user) => new User(user));
    const savedUsers = usersToSave.map((user) => user.save());
    await Promise.all(savedUsers);
  });
  it("those users are returned by GET /api/users", async () => {
    const res = await request(app)
      .get("/api/users")
      .expect(200);
    const expectedUsernames = testData.initialUsers.map((user) => user.username);
    const expectedNames = testData.initialUsers.map((user) => user.name);
    const recievedUsernames = res.body.map((user) => user.username);
    const recievedNames = res.body.map((user) => user.name);
    expect(recievedUsernames).toEqual(expectedUsernames);
    expect(recievedNames).toEqual(expectedNames);
  });
});
