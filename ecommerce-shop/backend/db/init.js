const fs = require("fs");
const path = require("path");

async function initDatabase(pool) {
  const schemaPath = path.join(__dirname, "schema.sql");
  const seedPath = path.join(__dirname, "seed.sql");

  await pool.query(fs.readFileSync(schemaPath, "utf8"));

  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM products"
  );

  if (rows[0].count === 0) {
    await pool.query(fs.readFileSync(seedPath, "utf8"));
    console.log("Database seeded with products");
  }
}

module.exports = { initDatabase };
