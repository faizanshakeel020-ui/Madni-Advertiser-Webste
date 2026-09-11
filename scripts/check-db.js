const Database = require("better-sqlite3");

const db = new Database("db/custom.db");

const tables = [
  "Product",
  "Order",
  "QuoteRequest",
  "Service",
  "PortfolioItem"
];

for (const table of tables) {
  const result = db
    .prepare(`SELECT COUNT(*) AS n FROM "${table}" WHERE updatedAt IS NULL`)
    .get();

  console.log(`${table}: ${result.n}`);
}

db.close();