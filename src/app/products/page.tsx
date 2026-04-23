'use client'

import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct } from '@/actions/catalog';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('PRODUCT');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setType(product.type);
    setPrice(product.price.toString());
    setDescription(product.description || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setType('PRODUCT');
    setPrice('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      type,
      price: parseFloat(price) || 0,
      description
    };

    const res = editingId
      ? await updateProduct(editingId, payload)
      : await createProduct(payload);

    if (res.success) {
      handleCancel();
      fetchProducts();
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8 flex justify-between align-center">
        <div>
          <h1 className="text-3xl font-bold">Products & Services</h1>
          <p className="text-secondary text-base">Manage your catalog for faster invoicing.</p>
        </div>
        <div>
          <button onClick={showForm ? handleCancel : () => setShowForm(true)} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ Add Item'}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">Add New Item</h2>
          <form onSubmit={handleSubmit} className="grid-2-col">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-control" placeholder="e.g. Consulting Hour" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="form-control">
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default Price (৳)</label>
              <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required className="form-control" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: 'fit-content' }}>
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-secondary">Loading catalog...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-right">Default Price</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-secondary">No items found. Add your first product or service.</td>
                  </tr>
                ) : (
                  products.map(item => (
                    <tr key={item.id}>
                      <td className="font-bold">{item.name}</td>
                      <td>
                        <span className={`badge ${item.type === 'PRODUCT' ? 'badge-neutral' : 'badge-info'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="text-secondary">{item.description || '-'}</td>
                      <td className="text-right font-medium">{formatCurrency(item.price)}</td>
                      <td className="text-center">
                        <button onClick={() => handleEdit(item)} className="edit-btn">✏️ Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-4 { margin-bottom: 16px; }
        .mb-8 { margin-bottom: 32px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .align-center { align-items: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .data-table th, .data-table td { padding: 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
        
        .badge { display: inline-block; padding: 4px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;}
        .badge-neutral { background-color: #f1f5f9; color: #475569; }
        .badge-info { background-color: #e0f2fe; color: #0284c7; }

        .edit-btn { color: #ffffff; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); font-weight: 600; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s; font-size: 0.85rem;}
        .edit-btn:hover { background-color: rgba(255, 255, 255, 0.25); border-color: rgba(255, 255, 255, 0.4); }

        @media (max-width: 768px) { .grid-2-col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
