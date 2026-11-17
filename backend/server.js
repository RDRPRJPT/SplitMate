const express = require("express");

const app = express();

app.use(express.json());

const PORT = 5000;

app.post("/api/expenses",(req,res) =>{
    console.log(req.body);
    res.send("Expense received");
})
app.get("/",(req,res) =>{
    res.send("Welcome to SplitMate Backend!");  
})

app.get("/api/test",(req,res) =>{
    res.send("SplitMate is working!");  
})

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})