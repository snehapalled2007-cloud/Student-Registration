// backend/index.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('data.db');

// Create table
db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// POST /products
app.post('/products', (req, res) => {
  const { name, category, quantity, price } = req.body;

  if (!name || name.trim() === '' || !category || category.trim() === '') {
    return res.status(400).json({ error: "Name and category are required." });
  }
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Quantity must be greater than or equal to 0." });
  }
  if (price === undefined || price <= 0) {
    return res.status(400).json({ error: "Price must be greater than 0." });
  }

  const created_at = new Date().toISOString();
  const info = db.prepare(
    'INSERT INTO products (name, category, quantity, price, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(name, category, quantity, price, created_at);

  const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(newProduct);
});

// GET /products
app.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// GET /products/:id
app.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// PUT /products/:id
app.put('/products/:id', (req, res) => {
  const { name, category, quantity, price } = req.body;
  const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  
  if (!productExists) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.prepare(
    'UPDATE products SET name = ?, category = ?, quantity = ?, price = ? WHERE id = ?'
  ).run(name, category, quantity, price, req.params.id);

  const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updatedProduct);
});

// PATCH /products/:id/stock
app.patch('/products/:id/stock', (req, res) => {
  const { quantity } = req.body;
  const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);

  if (!productExists) {
    return res.status(404).json({ error: "Product not found" });
  }
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: "Quantity must be greater than or equal to 0." });
  }

  db.prepare('UPDATE products SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updatedProduct);
});

// DELETE /products/:id
app.delete('/products/:id', (req, res) => {
  const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!productExists) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: "Product deleted successfully" });
});

// GET /dashboard
app.get('/dashboard', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalProducts, 
      SUM(quantity) as totalQuantity, 
      SUM(quantity * price) as inventoryValue 
    FROM products
  `).get();

  const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity < 5').get();

  res.json({
    totalProducts: stats.totalProducts || 0,
    totalQuantity: stats.totalQuantity || 0,
    inventoryValue: stats.inventoryValue || 0,
    lowStockItems: lowStockCount.count || 0
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});