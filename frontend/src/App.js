import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || '';

const CATEGORY_ICONS = {
  cards: '🪪',
  invitations: '💌',
  stationery: '📄',
  marketing: '📢',
  labels: '🏷️',
  signage: '🪧',
  default: '🖨️',
};

function Nav() {
  return (
    <nav>
      <div className="container">
        <span className="nav-brand">PrintCraft</span>
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#why-us">Why Us</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#contact"><span style={{color:'#D4A853'}}>Order Now</span></a></li>
        </ul>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h1>Premium Printing &<br /><span>Stationery Solutions</span></h1>
        <p>From elegant business cards to large format banners — we bring your brand to life with exceptional print quality and fast turnaround times.</p>
        <a href="#products" className="btn btn-primary">Explore Products</a>
        <a href="#contact" className="btn btn-outline">Get a Quote</a>
      </div>
    </section>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [orderProduct, setOrderProduct] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeCategory === 'all'
      ? `${API}/api/products`
      : `${API}/api/products?category=${activeCategory}`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory]);

  return (
    <section id="products" className="section products-bg">
      <div className="container">
        <div className="section-title">
          <h2>Our Products</h2>
          <div className="accent-line"></div>
          <p>High-quality printing for every need — business, personal, and promotional.</p>
        </div>

        <div className="filter-bar">
          <button
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-img">
                  {CATEGORY_ICONS[product.category] || CATEGORY_ICONS.default}
                </div>
                <div className="product-body">
                  <div className="product-category">{product.category}</div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <div className="product-price">
                      ${product.price} <span>from</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setOrderProduct(product);
                        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                      }}
                    >Order Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {orderProduct && (
          <p style={{ textAlign: 'center', marginTop: 24, color: '#D4A853', fontWeight: 600 }}>
            ↓ Ordering: {orderProduct.name} — Fill in the order form below
          </p>
        )}
      </div>
    </section>
  );
}

function WhyUs() {
  const features = [
    { icon: '🏆', title: 'Premium Quality', desc: 'Industry-leading paper stocks and inks for stunning results every time.' },
    { icon: '⚡', title: 'Fast Turnaround', desc: 'Same-day and next-day options available for urgent print requirements.' },
    { icon: '🎨', title: 'Custom Design', desc: 'Free design consultation to bring your brand vision to life.' },
    { icon: '💰', title: 'Competitive Pricing', desc: 'Bulk discounts available. The more you print, the more you save.' },
    { icon: '🚚', title: 'Free Delivery', desc: 'Free delivery on all orders over $100 within the metro area.' },
    { icon: '♻️', title: 'Eco-Friendly', desc: 'FSC certified paper and environmentally responsible printing processes.' },
  ];
  return (
    <section id="why-us" className="section">
      <div className="container">
        <div className="section-title">
          <h2>Why Choose PrintCraft</h2>
          <div className="accent-line"></div>
          <p>Trusted by thousands of businesses since 2008.</p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message });
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus({ type: 'error', msg: data.error });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="form-card">
      <h3>Get in Touch</h3>
      <p>Have a question? We'd love to hear from you.</p>
      {status && (
        <div className={status.type === 'success' ? 'form-success' : 'form-error'}>
          {status.msg}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input name="name" value={form.name} onChange={handle} required placeholder="John Smith" />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handle} required placeholder="john@example.com" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handle} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="form-group">
          <label>Message *</label>
          <textarea name="message" value={form.message} onChange={handle} required placeholder="Tell us how we can help..." />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

function OrderForm() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', product_id: '', quantity: 1, notes: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message });
        setForm({ customer_name: '', email: '', phone: '', product_id: '', quantity: 1, notes: '' });
      } else {
        setStatus({ type: 'error', msg: data.error });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="form-card">
      <h3>Place an Order</h3>
      <p>Ready to print? Fill in your details below.</p>
      {status && (
        <div className={status.type === 'success' ? 'form-success' : 'form-error'}>
          {status.msg}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input name="customer_name" value={form.customer_name} onChange={handle} required placeholder="John Smith" />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handle} required placeholder="john@example.com" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handle} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="form-group">
          <label>Product *</label>
          <select name="product_id" value={form.product_id} onChange={handle} required>
            <option value="">Select a product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input name="quantity" type="number" min="1" value={form.quantity} onChange={handle} />
        </div>
        <div className="form-group">
          <label>Special Instructions</label>
          <textarea name="notes" value={form.notes} onChange={handle} placeholder="Colours, size, design preferences..." />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}

function Contact() {
  return (
    <section id="contact" className="section" style={{ background: '#f5f3ef' }}>
      <div className="container">
        <div className="section-title">
          <h2>Contact & Orders</h2>
          <div className="accent-line"></div>
          <p>Reach out for a quote or place your order directly.</p>
        </div>
        <div className="forms-grid">
          <ContactForm />
          <OrderForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <span className="nav-brand">PrintCraft</span>
        <p>Premium printing & stationery solutions since 2008.</p>
        <ul className="footer-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#why-us">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <hr className="divider" />
        <p style={{ fontSize: '0.8rem', color: '#555' }}>
          © {new Date().getFullYear()} PrintCraft. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Products />
      <WhyUs />
      <Contact />
      <Footer />
    </>
  );
}
