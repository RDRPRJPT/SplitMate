const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET - Retrieve all groups
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM groups ORDER BY id ASC"
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
router.get("/:groupID/members", async (req, res) => {
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
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Group name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO groups (name)
             VALUES ($1)
             RETURNING *`,
            [name.trim()]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to create group"
        });
    }
});

// POST - Add a member to a group
router.post("/:groupID/members", async (req, res) => {
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

module.exports = router;