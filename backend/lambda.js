const { getCategories, getProducts, getProductById, createContact, createOrder } = require('./db');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;
  const query = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return response(200, {});
  }

  try {
    // GET /health
    if (method === 'GET' && path === '/health') {
      return response(200, { status: 'ok' });
    }

    // GET /api/categories
    if (method === 'GET' && path === '/api/categories') {
      const categories = await getCategories();
      return response(200, categories);
    }

    // GET /api/products
    if (method === 'GET' && path === '/api/products') {
      const products = await getProducts(query.category);
      return response(200, products);
    }

    // GET /api/products/{id}
    if (method === 'GET' && path.startsWith('/api/products/')) {
      const id = path.split('/').pop();
      const product = await getProductById(id);
      if (!product) return response(404, { error: 'Product not found' });
      return response(200, product);
    }

    // POST /api/contact
    if (method === 'POST' && path === '/api/contact') {
      const { name, email, phone, message } = body;
      if (!name || !email || !message) {
        return response(400, { error: 'Name, email and message are required' });
      }
      const id = await createContact({ name, email, phone, message });
      return response(201, { id, message: 'Message sent successfully!' });
    }

    // POST /api/order
    if (method === 'POST' && path === '/api/order') {
      const { customer_name, email, phone, product_id, quantity, notes } = body;
      if (!customer_name || !email || !product_id) {
        return response(400, { error: 'Name, email and product are required' });
      }
      const id = await createOrder({ customer_name, email, phone, product_id, quantity, notes });
      return response(201, { id, message: 'Order placed successfully! We will contact you shortly.' });
    }

    return response(404, { error: 'Route not found' });

  } catch (err) {
    console.error('Error:', err);
    return response(500, { error: 'Internal server error', details: err.message });
  }
};
