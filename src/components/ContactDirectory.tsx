'use client'

import { useState, useEffect } from 'react';
import { getContactsByType, createContact } from '@/actions/contact';
import { getProducts } from '@/actions/catalog';
import Link from 'next/link';

export default function ContactDirectory({ type, title }: { type: string, title: string }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [defaultProductId, setDefaultProductId] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [type]);

  const fetchContacts = async () => {
    setLoading(true);
    const [data, prodData] = await Promise.all([
      getContactsByType(type),
      getProducts()
    ]);
    setContacts(data);
    setProducts(prodData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const res = await createContact({
      name, type, email, phone, address, defaultProductId
    });

    if (res.success) {
      setName(''); setEmail(''); setPhone(''); setAddress(''); setDefaultProductId('');
      setShowForm(false);
      fetchContacts();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8 flex justify-between align-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-secondary text-base">Manage your {title.toLowerCase()} directory.</p>
        </div>
        <div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : `+ Add ${type === 'CUSTOMER' ? 'Customer' : 'Supplier'}`}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">Add New {type === 'CUSTOMER' ? 'Customer' : 'Supplier'}</h2>
          <form onSubmit={handleSubmit} className="grid-2-col">
            <div className="form-group">
              <label>Company / Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Billing Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="form-control" />
            </div>
            {type === 'CUSTOMER' && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Default Product / Service</label>
                <select value={defaultProductId} onChange={e => setDefaultProductId(e.target.value)} className="form-control">
                  <option value="">None (Select Manually in Invoice)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ৳{p.price}</option>
                  ))}
                </select>
                <p className="text-xs text-secondary mt-1">This service will be automatically added when you create an invoice for this customer.</p>
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: 'fit-content' }}>
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-secondary">Loading directory...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th className="text-center">Invoices</th>
                  <th className="text-center">Transactions</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-secondary">No {title.toLowerCase()} found.</td>
                  </tr>
                ) : (
                  contacts.map(contact => (
                    <tr key={contact.id}>
                      <td className="font-bold text-lg">{contact.name}</td>
                      <td>
                        <div className="text-sm text-secondary">
                          {contact.email && <div>✉️ {contact.email}</div>}
                          {contact.phone && <div>📞 {contact.phone}</div>}
                          {(!contact.email && !contact.phone) && '-'}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-info">{contact.invoices.length}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-neutral">{contact.lines.length}</span>
                      </td>
                      <td className="text-right">
                        <Link href={`/contacts/${contact.id}`} className="view-btn">View Statement</Link>
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
        .text-lg { font-size: 1.1rem; }
        .text-sm { font-size: 0.85rem; }
        
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .view-btn { color: var(--brand-primary); font-weight: 600; text-decoration: none; font-size: 0.9rem; padding: 6px 12px; border-radius: var(--radius-sm); background-color: rgba(67, 24, 255, 0.05); transition: background-color 0.2s; }
        .view-btn:hover { background-color: rgba(67, 24, 255, 0.15); }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .data-table th, .data-table td { padding: 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }
        
        .badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700;}
        .badge-neutral { background-color: #f1f5f9; color: #475569; }
        .badge-info { background-color: #e0f2fe; color: #0284c7; }

        @media (max-width: 768px) { .grid-2-col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
