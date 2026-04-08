const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('../routes/auth'));
app.use('/api/products', require('../routes/products'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/payments', require('../routes/payments'));

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

module.exports = app;