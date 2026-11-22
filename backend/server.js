const express = require("express");
const pool = require("./config/db");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

const PORT = 5000;

// Middleware must come before routes
app.use(cors());
app.use(express.json());


// Register routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to SplitMate Backend!");
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});