const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// POST - Add an expense
router.post("/", async (req, res) => {
    try {
        const { description, amount, paidBy } = req.body;

        const result = await pool.query(
            `INSERT INTO expenses (description, amount, paid_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [description, amount, paidBy]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add expense" });
    }
});

// GET - Retrieve all expenses
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses ORDER BY id ASC"
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

module.exports = router;