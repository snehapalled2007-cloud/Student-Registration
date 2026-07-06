// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';

const API_URL = "http://localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    inventoryValue: 0,
    lowStockItems: 0
  });

  // Add Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // Inline Editing State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', quantity: '', price: '' });

  const refreshAll = async () => {
    try {
      const prodRes = await fetch(`${API_URL}/products`);
      const prodData = await prodRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);

      const dashRes = await fetch(`${API_URL}/dashboard`);
      const dashData = await dashRes.json();
      setDashboard(dashData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAddProduct = async (e) => {
    if (e) e.preventDefault();
    if (!name || !category || !quantity || !price) return alert("Please fill out all fields");

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          quantity: parseInt(quantity, 10),
          price: parseFloat(price)
        })
      });
      if (response.ok) {
        setName('');
        setCategory('');
        setQuantity('');
        setPrice('');
        refreshAll();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price
    });
  };

  const handleUpdateProduct = async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          quantity: parseInt(editForm.quantity, 10),
          price: parseFloat(editForm.price)
        })
      });
      if (response.ok) {
        setEditingId(null);
        refreshAll();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        refreshAll();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="container">
      <h1>📦 Inventory Manager</h1>

      {/* Dashboard Section */}
      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>Total Products</h3>
          <p className="dash-value">{dashboard.totalProducts}</p>
        </div>
        <div className="dash-card">
          <h3>Total Quantity</h3>
          <p className="dash-value">{dashboard.totalQuantity}</p>
        </div>
        <div className="dash-card">
          <h3>Inventory Value</h3>
          <p className="dash-value">${dashboard.inventoryValue.toFixed(2)}</p>
        </div>
        <div className="dash-card low-stock-alert">
          <h3>Low Stock Items</h3>
          <p className="dash-value">{dashboard.lowStockItems}</p>
        </div>
      </div>

      {/* Add Product Section */}
      <div className="card form-container">
        <h2>Add New Product</h2>
        <form onSubmit={handleAddProduct} className="product-form">
          <input 
            type="text" 
            placeholder="Product Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Quantity" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            min="0"
          />
          <input 
            type="number" 
            step="0.01" 
            placeholder="Price" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            min="0"
          />
          <button type="submit" className="btn btn-primary">Add Product</button>
        </form>
      </div>

      {/* Product List Grid */}
      <h2>Product List</h2>
      {products.length === 0 ? (
        <p className="no-products">No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="card product-card">
              {editingId === product.id ? (
                <div className="inline-edit-form">
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                  />
                  <input 
                    type="text" 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    value={editForm.quantity} 
                    onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} 
                    min="0"
                  />
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editForm.price} 
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})} 
                    min="0"
                  />
                  <div className="card-actions">
                    <button onClick={() => handleUpdateProduct(product.id)} className="btn btn-primary">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{product.name}</h3>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Quantity:</strong> <span className={product.quantity < 5 ? 'text-danger' : ''}>{product.quantity}</span></p>
                  <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                  <div className="card-actions">
                    <button onClick={() => startEdit(product)} className="btn btn-primary">Update</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-danger">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;