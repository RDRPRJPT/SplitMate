const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

describe("POST /api/users/register", () => {
    test("should reject registration with missing fields", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({});

        expect(response.statusCode).toBe(400);
    });


    test("should reject an invalid email address", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Test User",
                email: "invalid-email",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
    });

    test("should reject a password shorter than 8 characters", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "1234567"
            });

        expect(response.statusCode).toBe(400);
    });


    test("should register a new user successfully", async () => {
        const email = `jesttest-${Date.now()}@example.com`;

        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Jest Test User",
                email,
                password: "password123"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.email).toBe(email);
        expect(response.body.user).not.toHaveProperty("password_hash");
    });


    test("should reject duplicate email", async () => {
        const email = `duplicate-${Date.now()}@example.com`;

        await request(app)
            .post("/api/users/register")
            .send({
                name: "Test User",
                email,
                password: "password123"
            });

        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        try {
            const response = await request(app)
                .post("/api/users/register")
                .send({
                    name: "Test User",
                    email,
                    password: "password123"
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toBe("Email already exists");
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    afterEach(async () => {
        await pool.query(
            "DELETE FROM users WHERE email LIKE 'jesttest-%@example.com' OR email LIKE 'duplicate-%@example.com'"
        );
    });


});

describe("POST /api/users/login", () => {
    test("should reject login with missing credentials", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .send({});

        expect(response.statusCode).toBe(400);
    });
    test("should reject login with an unregistered email", async () => {
        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: "nonexistent@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(401);
    });

    test("should reject an incorrect password", async () => {
        const user = {
            name: "Login Test",
            email: `login-${Date.now()}@example.com`,
            password: "correctpassword"
        };

        await request(app)
            .post("/api/users/register")
            .send(user);

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: user.email,
                password: "wrongpassword"
            });

        expect(response.statusCode).toBe(401);
    });

    test("should login successfully and return a JWT token", async () => {
        const user = {
            name: "Successful Login Test",
            email: `success-${Date.now()}@example.com`,
            password: "correctpassword"
        };

        await request(app)
            .post("/api/users/register")
            .send(user);

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: user.email,
                password: user.password
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body.user.email).toBe(user.email);

        const profileResponse = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${response.body.token}`);

        expect(profileResponse.statusCode).toBe(200);
        expect(profileResponse.body.email).toBe(user.email);
    });
});

afterAll(async () => {
    await pool.query(`
        DELETE FROM users
        WHERE email LIKE 'jesttest-%@example.com'
        OR email LIKE 'duplicate-%@example.com'
        OR email LIKE 'login-%@example.com'
        OR email LIKE 'success-%@example.com'
    `);
    await pool.end();
});