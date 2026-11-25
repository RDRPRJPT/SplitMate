
const express = require("express");
const cors = require("cors");

const pool = require("./config/db");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to SplitMate Backend!");
});

// Database test route
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

module.exports = app;
