const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");


afterAll(async () => {
    await pool.end();
});

describe("Authentication middleware", () => {
    test("should reject requests without a token", async () => {
        const response = await request(app).get("/api/users");

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe(
            "Access denied. No token provided."
        );
    });
});


test("should reject an invalid token", async () => {
    const response = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer invalid_token");

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Invalid or expired token");
});

const jwt = require("jsonwebtoken");

// Add this test inside the describe block
test("should allow requests with a valid token", async () => {
    const token = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
});
