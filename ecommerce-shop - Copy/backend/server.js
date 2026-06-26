require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { initDatabase } = require("./db/init");

const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image_url,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : null,
    onSale: row.on_sale,
    newArrival: row.new_arrival,
    category: row.category,
  };
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    res.status(503).json({ status: "error", message: error.message });
  }
});

app.get("/products", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );
    res.json(rows.map(toProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(toProduct(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders", async (req, res) => {
  const { items, subtotal, shippingFee, orderTotal } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order items are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO orders (items, subtotal, shipping_fee, order_total)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [
        JSON.stringify(items),
        subtotal ?? 0,
        shippingFee ?? 0,
        orderTotal ?? 0,
      ]
    );

    res.status(201).json({
      id: rows[0].id,
      createdAt: rows[0].created_at,
      message: "Order placed successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    await initDatabase(pool);
    console.log("Database ready");
  } catch (error) {
    console.error("Database init failed:", error.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

start();
