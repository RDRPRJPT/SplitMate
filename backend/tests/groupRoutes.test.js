
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const pool = require("../config/db");

function createToken(userId = 1) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function cleanupGroup(groupID) {
    if (!groupID) return;

    await pool.query(
        "DELETE FROM group_members WHERE group_id = $1",
        [groupID]
    );

    await pool.query(
        "DELETE FROM groups WHERE id = $1",
        [groupID]
    );
}

// POST /api/groups
describe("POST /api/groups", () => {
    test("should create a group successfully", async () => {
        const token = createToken();
        let groupID;

        try {
            const response = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Jest Test Group"
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe("Jest Test Group");
            expect(response.body).toHaveProperty("id");

            groupID = response.body.id;
        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should automatically add the creator as a group member", async () => {
        const token = createToken();
        let groupID;

        try {
            const response = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Creator Membership Test"
                });

            groupID = response.body.id;

            const result = await pool.query(
                `SELECT * FROM group_members
                 WHERE group_id = $1 AND user_id = $2`,
                [groupID, 1]
            );

            expect(response.statusCode).toBe(201);
            expect(result.rows.length).toBe(1);
        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should reject a group with a missing name", async () => {
        const token = createToken();

        const response = await request(app)
            .post("/api/groups")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Group name is required");
    });

    test("should reject a group name exceeding 100 characters", async () => {
        const token = createToken();

        const response = await request(app)
            .post("/api/groups")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "A".repeat(101)
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            "Group name cannot exceed 100 characters"
        );
    });
});

// GET /api/groups
describe("GET /api/groups", () => {
    test("should return groups belonging to the logged-in user", async () => {
        const token = createToken();

        const response = await request(app)
            .get("/api/groups")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        response.body.forEach((group) => {
            expect(group).toHaveProperty("id");
            expect(group).toHaveProperty("name");
        });
    });

    test("should reject requests without an authentication token", async () => {
        const response = await request(app)
            .get("/api/groups");

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe(
            "Access denied. No token provided."
        );
    });
});

// POST /api/groups/:groupID/members
describe("POST /api/groups/:groupID/members", () => {
    test("should add a member to a group successfully", async () => {
        const token = createToken();
        const email = `groupmember-${Date.now()}@example.com`;

        let groupID;

        try {
            // Create a test user
            const userResponse = await request(app)
                .post("/api/users/register")
                .send({
                    name: "Group Member Test",
                    email,
                    password: "password123"
                });

            expect(userResponse.statusCode).toBe(201);

            const newUserID = userResponse.body.user.id;

            // Create a group
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Add Member Test"
                });

            expect(groupResponse.statusCode).toBe(201);

            groupID = groupResponse.body.id;

            // Add the new user
            const response = await request(app)
                .post(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userID: newUserID
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.group_id).toBe(groupID);
            expect(response.body.user_id).toBe(newUserID);

        } finally {
            await cleanupGroup(groupID);

            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [email]
            );
        }
    });

    test("should reject adding an existing member", async () => {
        const token = createToken();
        let groupID;

        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Duplicate Member Test"
                });

            expect(groupResponse.statusCode).toBe(201);

            groupID = groupResponse.body.id;

            // Creator is already a member, so adding user 1 again should fail
            const response = await request(app)
                .post(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userID: 1
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toBe(
                "User is already a member of this group"
            );

        } finally {
            consoleErrorSpy.mockRestore();
            await cleanupGroup(groupID);
        }
    });

    test("should reject an invalid user ID", async () => {
        const token = createToken();
        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Invalid User ID Test"
                });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .post(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userID: -5
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe(
                "Valid user ID is required"
            );
        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should prevent non-members from adding members", async () => {
        const creatorToken = createToken(1);
        const nonMemberToken = createToken(2);

        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${creatorToken}`)
                .send({
                    name: "Non Member Access Test"
                });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .post(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${nonMemberToken}`)
                .send({
                    userID: 1
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Group not found");

        } finally {
            await cleanupGroup(groupID);
        }
    });
});

describe("GET /api/groups/:groupID/members", () => {
    test("should return all members of a group", async () => {
        const token = createToken();
        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Get Members Test"
                });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .get(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);

            expect(response.body[0].id).toBe(1);
            expect(response.body[0].name).toBeDefined();
            expect(response.body[0].email).toBeDefined();

        } finally {
            await cleanupGroup(groupID);
        }
    });
});

describe("GET /api/groups/:groupID/members", () => {
    test("should prevent non-members from viewing group members", async () => {
        const creatorToken = createToken(1);
        const nonMemberToken = createToken(2);
        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${creatorToken}`)
                .send({ name: "Private Members Test" });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .get(`/api/groups/${groupID}/members`)
                .set("Authorization", `Bearer ${nonMemberToken}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Group not found");
        } finally {
            await cleanupGroup(groupID);
        }
    });
});

describe("GET /api/groups/:groupID/balances", () => {
    test("should return balances for all group members", async () => {
        const token = createToken(1);
        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Balances Test" });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .get(`/api/groups/${groupID}/balances`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1);

            expect(response.body[0].user_id).toBe(1);
            expect(Number(response.body[0].total_paid)).toBe(0);
            expect(Number(response.body[0].total_owed)).toBe(0);
            expect(Number(response.body[0].net_balance)).toBe(0);
        } finally {
            await cleanupGroup(groupID);
        }
    });
});

describe("GET /api/groups/:groupID/settlements", () => {
    test("should return an empty array when there are no settlements", async () => {
        const token = createToken(1);
        let groupID;

        try {
            const groupResponse = await request(app)
                .post("/api/groups")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Settlements Test" });

            groupID = groupResponse.body.id;

            const response = await request(app)
                .get(`/api/groups/${groupID}/settlements`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([]);
        } finally {
            await cleanupGroup(groupID);
        }
    });
});

afterAll(async () => {
    await pool.end();
});
