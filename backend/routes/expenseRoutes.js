const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// POST - Add an expense
router.post("/", async (req, res) => {
    try {
        const { description, amount, paidBy, groupID } = req.body;

        if(!description || !description.trim()){
            return res.status(400).json({
                error:"Description is required"
            });
        }
        if(!Number.isInteger(amount) || amount<=0){
            return res.status(400).json({
                error:"Amount should be positive integer"
            });
        }
        if(!Number.isInteger(paidBy) || paidBy<=0){
            return res.status(400).json({
                error:"Valid payer ID is required"
            })
        }
        if(!Number.isInteger(groupID) || groupID<=0){
            return res.status(400).json({
                error:"Valid group ID is required"
            })
        }
        const result = await pool.query(
            `INSERT INTO expenses (description, amount, paid_by, group_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [description, amount, paidBy, groupID]
        );

        res.status(201).json(result.rows[0]);

    } 
    catch (error) {
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
    }
});

// GET - Retrieve all expenses
// GET - Retrieve expenses
router.get("/", async (req, res) => {
    try {
        const { groupID } = req.query;
        let result;

        if (groupID) {
            result = await pool.query(
                `SELECT
                    e.id,
                    e.description,
                    e.amount,
                    e.paid_by,
                    u.name AS paid_by_name,
                    e.group_id,
                    g.name AS group_name
                FROM expenses e
                JOIN users u ON e.paid_by = u.id
                JOIN groups g ON e.group_id = g.id
                WHERE e.group_id = $1
                ORDER BY e.id ASC`,
                [groupID]
            );
        } else {
            result = await pool.query(
                `SELECT
                    e.id,
                    e.description,
                    e.amount,
                    e.paid_by,
                    u.name AS paid_by_name,
                    e.group_id,
                    g.name AS group_name
                FROM expenses e
                JOIN users u ON e.paid_by = u.id
                JOIN groups g ON e.group_id = g.id
                ORDER BY e.id ASC`
            );
        }

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
}); 

module.exports = router;