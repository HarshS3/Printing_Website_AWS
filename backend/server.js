require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDB() {
  const conn = await pool.getConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      product_id INT,
      quantity INT DEFAULT 1,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM products');
  if (rows[0].count === 0) {
    await conn.execute(`
      INSERT INTO products (name, category, description, price) VALUES
      ('Business Cards', 'cards', 'Premium quality business cards with glossy or matte finish. 350gsm paper.', 25.00),
      ('Wedding Invitations', 'invitations', 'Elegant custom wedding invitations with envelopes. Multiple designs available.', 120.00),
      ('A4 Letterheads', 'stationery', 'Branded letterheads for your business. 100gsm premium paper.', 45.00),
      ('Brochures Tri-fold', 'marketing', 'Full color tri-fold brochures. 150gsm gloss paper.', 80.00),
      ('Notebooks', 'stationery', 'Custom branded notebooks with your logo. A5 and A4 sizes.', 35.00),
      ('Banners', 'signage', 'Large format vinyl banners for events and promotions.', 95.00),
      ('Stickers & Labels', 'labels', 'Custom die-cut stickers and product labels. Waterproof available.', 30.00),
      ('Flyers', 'marketing', 'Single or double sided flyers. A5 and A6 sizes available.', 40.00)
    `);
  }
  conn.release();
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY name';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ?', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, message]
    );
    res.status(201).json({ id: result.insertId, message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.post('/api/order', async (req, res) => {
  const { customer_name, email, phone, product_id, quantity, notes } = req.body;
  if (!customer_name || !email || !product_id) {
    return res.status(400).json({ error: 'Name, email and product are required' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO orders (customer_name, email, phone, product_id, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, email, phone || null, product_id, quantity || 1, notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Order placed successfully! We will contact you shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

const PORT = process.env.PORT || 3000;
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
