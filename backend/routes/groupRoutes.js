const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// Check whether the logged-in user belongs to the group
async function checkGroupMembership(req, res, next) {
    try {
        const { groupID } = req.params;

        const result = await pool.query(
            `SELECT 1
             FROM group_members
             WHERE group_id = $1 AND user_id = $2`,
            [groupID, req.user.userId]
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

// GET - Retrieve all groups
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.*
                FROM groups g
                JOIN group_members gm ON gm.group_id = g.id
                WHERE gm.user_id = $1
                ORDER BY g.id ASC`,
                [req.user.userId]   
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch groups"
        });
    }
});

// GET - Retrieve members of a group
router.get("/:groupID/members",checkGroupMembership, async (req, res) => {
    try {
        const { groupID } = req.params;

        const result = await pool.query(
            `SELECT
                users.id,
                users.name,
                users.email
            FROM group_members
            JOIN users
                ON group_members.user_id = users.id
            WHERE group_members.group_id = $1`,
            [groupID]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch group members"
        });
    }
});

// POST - Create a new group
// POST - Create a new group
router.post("/", async (req, res) => {
    let client;

    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                error: "Group name is required"
            });
        }

        client = await pool.connect();

        await client.query("BEGIN");

        const groupResult = await client.query(
            `INSERT INTO groups (name)
             VALUES ($1)
             RETURNING *`,
            [name.trim()]
        );

        const newGroup = groupResult.rows[0];

        await client.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)`,
            [newGroup.id, req.user.userId]
        );

        await client.query("COMMIT");

        res.status(201).json(newGroup);

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.error(error);

        res.status(500).json({
            error: "Failed to create group"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// POST - Add a member to a group
router.post("/:groupID/members",checkGroupMembership, async (req, res) => {
    try {
        const { groupID } = req.params;
        const { userID } = req.body;

        if (!Number.isInteger(userID) || userID <= 0) {
            return res.status(400).json({
                error: "Valid user ID is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO group_members (group_id, user_id)
            VALUES ($1, $2)
            RETURNING *`,
            [groupID, userID]
        );

        res.status(201).json(result.rows[0]);
    } 
    catch (error) {
        console.error(error);

        if (error.code === "23503") {
            return res.status(400).json({
                error: "Invalid group ID or user ID"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                error: "User is already a member of this group"
            });
        }

        res.status(500).json({
            error: "Failed to add member"
        });
    }
});


// GET - Calculate balances of all group members
router.get("/:groupID/balances",checkGroupMembership, async (req, res) => {
    try {
        const { groupID } = req.params;

        const result = await pool.query(
            `WITH paid AS (
                SELECT
                    e.paid_by AS user_id,
                    SUM(e.amount) AS total_paid
                FROM expenses e
                WHERE e.group_id = $1
                  AND EXISTS (
                      SELECT 1
                      FROM expense_splits s
                      WHERE s.expense_id = e.id
                  )
                GROUP BY e.paid_by
            ),
            owed AS (
                SELECT
                    s.user_id,
                    SUM(s.amount_owed) AS total_owed
                FROM expense_splits s
                JOIN expenses e ON e.id = s.expense_id
                WHERE e.group_id = $1
                GROUP BY s.user_id
            )
            SELECT
                u.id AS user_id,
                u.name,
                COALESCE(p.total_paid, 0) AS total_paid,
                COALESCE(o.total_owed, 0) AS total_owed,
                COALESCE(p.total_paid, 0) -
                COALESCE(o.total_owed, 0) AS net_balance
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            LEFT JOIN paid p ON p.user_id = u.id
            LEFT JOIN owed o ON o.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY u.id`,
            [groupID]
        );

        const balances = result.rows.map((member) => ({
            ...member,
            total_paid: Number(member.total_paid),
            total_owed: Number(member.total_owed),
            net_balance: Number(member.net_balance),
        }));

        res.status(200).json(balances);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to calculate group balances"
        });
    }
});


// GET - Generate settlement suggestions
router.get("/:groupID/settlements",checkGroupMembership, async (req, res) => {
    try {
        const { groupID } = req.params;

        const result = await pool.query(
            `WITH paid AS (
                SELECT
                    e.paid_by AS user_id,
                    SUM(e.amount) AS total_paid
                FROM expenses e
                WHERE e.group_id = $1
                  AND EXISTS (
                      SELECT 1
                      FROM expense_splits s
                      WHERE s.expense_id = e.id
                  )
                GROUP BY e.paid_by
            ),
            owed AS (
                SELECT
                    s.user_id,
                    SUM(s.amount_owed) AS total_owed
                FROM expense_splits s
                JOIN expenses e ON e.id = s.expense_id
                WHERE e.group_id = $1
                GROUP BY s.user_id
            )
            SELECT
                u.id AS user_id,
                u.name,
                COALESCE(p.total_paid, 0) -
                COALESCE(o.total_owed, 0) AS net_balance
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            LEFT JOIN paid p ON p.user_id = u.id
            LEFT JOIN owed o ON o.user_id = u.id
            WHERE gm.group_id = $1`,
            [groupID]
        );

        const creditors = [];
        const debtors = [];

        result.rows.forEach((member) => {
            const balance = Number(member.net_balance);

            if (balance > 0) {
                creditors.push({
                    user_id: member.user_id,
                    name: member.name,
                    amount: balance
                });
            } else if (balance < 0) {
                debtors.push({
                    user_id: member.user_id,
                    name: member.name,
                    amount: -balance
                });
            }
        });

        const settlements = [];

        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const amount = Math.min(
                debtors[i].amount,
                creditors[j].amount
            );

            settlements.push({
                from: debtors[i].name,
                to: creditors[j].name,
                amount
            });

            debtors[i].amount -= amount;
            creditors[j].amount -= amount;

            if (debtors[i].amount === 0) i++;
            if (creditors[j].amount === 0) j++;
        }

        res.status(200).json(settlements);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to generate settlements"
        });
    }
});

module.exports = router;