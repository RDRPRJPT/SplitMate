const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

describe("GET /", () => {
    test("should return welcome message", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("Welcome to SplitMate Backend!");
    });
});

afterAll(async () => {
    await pool.end();
});