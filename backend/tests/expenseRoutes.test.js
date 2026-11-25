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
        "DELETE FROM expenses WHERE group_id = $1",
        [groupID]
    );

    await pool.query(
        "DELETE FROM group_members WHERE group_id = $1",
        [groupID]
    );

    await pool.query(
        "DELETE FROM groups WHERE id = $1",
        [groupID]
    );
}

async function createGroup(token, name) {
    const response = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${token}`)
        .send({ name });

    expect(response.statusCode).toBe(201);

    return response.body.id;
}

// POST /api/expenses
describe("POST /api/expenses", () => {

    test("should reject requests without an authentication token", async () => {
        const response = await request(app)
            .post("/api/expenses")
            .send({
                description: "Lunch",
                amount: 500,
                paidBy: 1,
                groupID: 1
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe(
            "Access denied. No token provided."
        );
    });

    test("should create an expense and its split records successfully", async () => {
        const token = createToken(1);
        let groupID;

        try {
            groupID = await createGroup(token, "Expense Creation Test");

            const response = await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    description: "Test Lunch",
                    amount: 500,
                    paidBy: 1,
                    groupID
                });

            expect(response.statusCode).toBe(201);

            const expenseResult = await pool.query(
                `SELECT * FROM expenses
                 WHERE group_id = $1 AND description = $2`,
                [groupID, "Test Lunch"]
            );

            expect(expenseResult.rows).toHaveLength(1);
            expect(Number(expenseResult.rows[0].amount)).toBe(500);
            expect(Number(expenseResult.rows[0].paid_by)).toBe(1);

            const splitResult = await pool.query(
                `SELECT * FROM expense_splits
                 WHERE expense_id = $1`,
                [expenseResult.rows[0].id]
            );

            expect(splitResult.rows).toHaveLength(1);
            expect(Number(splitResult.rows[0].user_id)).toBe(1);
            expect(Number(splitResult.rows[0].amount_owed)).toBe(500);

        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should reject an expense with an invalid amount", async () => {
        const token = createToken(1);
        let groupID;

        try {
            groupID = await createGroup(token, "Invalid Amount Test");

            const response = await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    description: "Invalid Expense",
                    amount: 0,
                    paidBy: 1,
                    groupID
                });

            expect(response.statusCode).toBe(400);

        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should reject an expense paid by a non-member", async () => {
        const token = createToken(1);
        let groupID;

        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        try {
            groupID = await createGroup(token, "Invalid Payer Test");

            const response = await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    description: "Invalid Payer Expense",
                    amount: 500,
                    paidBy: 999999,
                    groupID
                });

            expect(response.statusCode).toBe(400);

        } finally {
            consoleErrorSpy.mockRestore();
            await cleanupGroup(groupID);
        }
    });
});

// GET /api/expenses
describe("GET /api/expenses", () => {

    test("should retrieve expenses belonging to a group", async () => {
        const token = createToken(1);
        let groupID;

        try {
            groupID = await createGroup(token, "Get Expenses Test");

            await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    description: "Dinner Test",
                    amount: 800,
                    paidBy: 1,
                    groupID
                });

            const response = await request(app)
                .get(`/api/expenses?groupID=${groupID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].description).toBe("Dinner Test");

        } finally {
            await cleanupGroup(groupID);
        }
    });

    test("should reject requests without an authentication token", async () => {
        const response = await request(app)
            .get("/api/expenses?groupID=1");

        expect(response.statusCode).toBe(401);
    });

    test("should prevent non-members from retrieving group expenses", async () => {
        const creatorToken = createToken(1);
        const nonMemberToken = createToken(2);
        let groupID;

        try {
            groupID = await createGroup(
                creatorToken,
                "Private Expenses Test"
            );

            const response = await request(app)
                .get(`/api/expenses?groupID=${groupID}`)
                .set("Authorization", `Bearer ${nonMemberToken}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Group not found");

        } finally {
            await cleanupGroup(groupID);
        }
    });
});

afterAll(async () => {
    await pool.end();
});
