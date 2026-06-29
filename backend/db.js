const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let pool;

async function getCredentials() {
  // If individual env vars are set (EC2 with .env file) use them directly
  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  // Otherwise fetch from Secrets Manager (Lambda)
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const command = new GetSecretValueCommand({ SecretId: process.env.db_secret_name });
  const secret = await client.send(command);
  const creds = JSON.parse(secret.SecretString);
  return {
    host: creds.host,
    user: creds.username,
    password: creds.password,
    database: creds.dbname,
  };
}

async function getPool() {
  if (!pool) {
    const creds = await getCredentials();
    pool = mysql.createPool({
      ...creds,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

async function initDB() {
  const conn = await (await getPool()).getConnection();
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

async function getCategories() {
  const [rows] = await (await getPool()).execute(
    'SELECT DISTINCT category FROM products ORDER BY category'
  );
  return rows.map(r => r.category);
}

async function getProducts(category) {
  let query = 'SELECT * FROM products';
  const params = [];
  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }
  query += ' ORDER BY name';
  const [rows] = await (await getPool()).execute(query, params);
  return rows;
}

async function getProductById(id) {
  const [rows] = await (await getPool()).execute(
    'SELECT * FROM products WHERE id = ?', [id]
  );
  return rows[0] || null;
}

async function createContact({ name, email, phone, message }) {
  const [result] = await (await getPool()).execute(
    'INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [name, email, phone || null, message]
  );
  return result.insertId;
}

async function createOrder({ customer_name, email, phone, product_id, quantity, notes }) {
  const [result] = await (await getPool()).execute(
    'INSERT INTO orders (customer_name, email, phone, product_id, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [customer_name, email, phone || null, product_id, quantity || 1, notes || null]
  );
  return result.insertId;
}

module.exports = { initDB, getCategories, getProducts, getProductById, createContact, createOrder };
