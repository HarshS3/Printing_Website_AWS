require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB, getCategories, getProducts, getProductById, createContact, createOrder } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts(req.query.category);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
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
    const id = await createContact({ name, email, phone, message });
    res.status(201).json({ id, message: 'Message sent successfully!' });
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
    const id = await createOrder({ customer_name, email, phone, product_id, quantity, notes });
    res.status(201).json({ id, message: 'Order placed successfully! We will contact you shortly.' });
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
