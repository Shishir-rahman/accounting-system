'use client'

import { useState } from 'react';
import { updateContact } from '@/actions/contact';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProducts } from '@/actions/catalog';
import { useEffect } from 'react';

export default function ClientEditContact({ contact }: { contact: any }) {
  const router = useRouter();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [address, setAddress] = useState(contact.address || '');
  const [defaultProductId, setDefaultProductId] = useState(contact.defaultProductId || '');
  const [products, setProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact.type === 'CUSTOMER') {
      getProducts().then(data => setProducts(data));
    }
  }, [contact.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const res = await updateContact(contact.id, {
      name, type: contact.type, email, phone, address, defaultProductId
    });

    if (res.success) {
      router.push(`/contacts/${contact.id}`);
    } else {
      setError(res.error || 'Failed to update contact');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="mb-6">
        <Link href={`/contacts/${contact.id}`} className="back-link">← Back to Profile</Link>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h2 className="text-xl font-bold mb-6">Edit {contact.type === 'CUSTOMER' ? 'Customer' : 'Supplier'} Profile</h2>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="form-layout">
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
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="form-control" />
          </div>

          {contact.type === 'CUSTOMER' && (
            <div className="form-group">
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
          
          <div className="mt-8">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-8 { margin-top: 32px; }
        .back-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .back-link:hover { color: var(--brand-primary); }
        
        .form-layout { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }
      `}</style>
    </div>
  );
}
