const pool = require("./db")

const express = require("express");

const app = express();

app.use(express.json());

const PORT = 5000;

app.post("/api/expenses", async (req, res) => {
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

app.get("/",(req,res) =>{
    res.send("Welcome to SplitMate Backend!");  
})

app.get("/api/test",(req,res) =>{
    res.send("SplitMate is working!");  
})

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

app.get("/api/expenses", async (req, res) => {
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
app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})