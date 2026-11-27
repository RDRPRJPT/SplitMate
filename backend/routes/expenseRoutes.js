
const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// Check whether the logged-in user belongs to the group
async function checkGroupMembership(req, res, next) {
    try {
        const groupID = req.body?.groupID || req.query?.groupID;
        const numericGroupID = Number(groupID);

        if (
            !Number.isSafeInteger(numericGroupID) ||
            numericGroupID <= 0 ||
            numericGroupID > 2147483647
        ) {
            return res.status(400).json({
                error: "Valid group ID is required"
            });
        }

        const result = await pool.query(
            `SELECT 1
             FROM group_members
             WHERE group_id = $1 AND user_id = $2`,
            [numericGroupID, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Group not found"
            });
        }

        next();

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to verify group membership"
        });
    }
}

// POST - Add an expense
router.post("/", checkGroupMembership, async (req, res) => {
    const { description, amount, paidBy, groupID } = req.body;

    // Validate description
    if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
            error: "Description is required"
        });
    }

    if (!/\p{L}/u.test(description.trim())) {
        return res.status(400).json({
            error: "Description must contain at least one letter"
        });
    }

    if (description.trim().length > 100) {
        return res.status(400).json({
            error: "Description cannot exceed 100 characters"
        });
    }

    // Validate amount
    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        amount > 2147483647
    ) {
        return res.status(400).json({
            error: "Amount must be a positive safe integer within the allowed limit"
        });
    }

    // Validate payer ID
    if (
        !Number.isSafeInteger(paidBy) ||
        paidBy <= 0 ||
        paidBy > 2147483647
    ) {
        return res.status(400).json({
            error: "Valid payer ID is required"
        });
    }

    // Validate group ID
    if (
        !Number.isSafeInteger(groupID) ||
        groupID <= 0 ||
        groupID > 2147483647
    ) {
        return res.status(400).json({
            error: "Valid group ID is required"
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        // 1. Insert expense
        const expenseResult = await client.query(
            `INSERT INTO expenses (description, amount, paid_by, group_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [description.trim(), amount, paidBy, groupID]
        );

        const expense = expenseResult.rows[0];

        // 2. Fetch all group members
        const membersResult = await client.query(
            `SELECT user_id
             FROM group_members
             WHERE group_id = $1
             ORDER BY user_id ASC`,
            [groupID]
        );

        const members = membersResult.rows;

        // 3. Calculate equal shares
        const baseShare = Math.floor(amount / members.length);
        const remainder = amount % members.length;

        const splits = [];

        // 4. Insert each member's share
        for (let i = 0; i < members.length; i++) {
            const share = baseShare + (i < remainder ? 1 : 0);

            const splitResult = await client.query(
                `INSERT INTO expense_splits
                    (expense_id, user_id, amount_owed)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [expense.id, members[i].user_id, share]
            );

            splits.push(splitResult.rows[0]);
        }

        // 5. Commit transaction
        await client.query("COMMIT");

        res.status(201).json({
            ...expense,
            splits
        });

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        console.error(error);

        if (error.code === "23503") {
            return res.status(400).json({
                error: "Invalid user or group, or payer is not a member of this group"
            });
        }

        if (error.code === "23502") {
            return res.status(400).json({
                error: "A required field is missing"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Duplicate record"
            });
        }

        res.status(500).json({
            error: "Internal server error"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// GET - Retrieve all expenses, including their splits
router.get("/", checkGroupMembership, async (req, res) => {
    try {
        const { groupID } = req.query;

        const query = `
            SELECT
                e.id,
                e.description,
                e.amount,
                e.paid_by,
                u.name AS paid_by_name,
                e.group_id,
                g.name AS group_name,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'user_id', s.user_id,
                                'user_name', split_user.name,
                                'amount_owed', s.amount_owed
                            )
                            ORDER BY s.user_id
                        )
                        FROM expense_splits s
                        JOIN users split_user
                            ON s.user_id = split_user.id
                        WHERE s.expense_id = e.id
                    ),
                    '[]'::json
                ) AS splits

            FROM expenses e
            JOIN users u ON e.paid_by = u.id
            JOIN groups g ON e.group_id = g.id
            WHERE e.group_id = $1
            ORDER BY e.id ASC
        `;

        const result = await pool.query(query, [Number(groupID)]);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch expenses"
        });
    }
});

module.exports = router;
