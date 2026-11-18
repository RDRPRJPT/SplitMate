const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET - Retrieve all users
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM users ORDER BY id ASC"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch users"
        });
    }
});

// POST - Create a new user
router.post("/", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Name is required"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                error: "Email is required"
            });
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                error: "Invalid email format"
            });
        }
        const result = await pool.query(
            `INSERT INTO users (name, email)
             VALUES ($1, $2)
             RETURNING *`,
            [name.trim(), email.trim()]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Email already exists"
            });
        }

        res.status(500).json({
            error: "Failed to create user"
        });
    }
});

module.exports = router;