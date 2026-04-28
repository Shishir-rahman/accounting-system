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
  const [customRates, setCustomRates] = useState<any[]>(contact.customRates || []);
  const [products, setProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact.type === 'CUSTOMER') {
      getProducts().then(data => setProducts(data));
    }
  }, [contact.type]);

  const handleAddCustomRate = () => {
    setCustomRates([...customRates, { productId: '', rate: 0, vatType: 'EXCLUDE', vatRate: 5 }]);
  };

  const handleRemoveCustomRate = (index: number) => {
    setCustomRates(customRates.filter((_, i) => i !== index));
  };

  const handleUpdateCustomRate = (index: number, field: string, value: any) => {
    const newRates = [...customRates];
    newRates[index] = { ...newRates[index], [field]: value };
    setCustomRates(newRates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate custom rates
    const validCustomRates = customRates.filter(r => r.productId && r.rate >= 0);
    
    const res = await updateContact(contact.id, {
      name, 
      type: contact.type, 
      email, 
      phone, 
      address, 
      defaultProductId,
      customRates: validCustomRates.map(r => ({ 
        productId: r.productId, 
        rate: parseFloat(r.rate),
        vatType: r.vatType || 'EXCLUDE',
        vatRate: parseFloat(r.vatRate || 0)
      }))
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

      <div className="card" style={{ maxWidth: '800px' }}>
        <h2 className="text-xl font-bold mb-6">Edit {contact.type === 'CUSTOMER' ? 'Customer' : 'Supplier'} Profile</h2>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="form-layout">
          <div className="grid-2-col">
            <div className="form-group">
              <label>Company / Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Default Product / Service</label>
              <select value={defaultProductId} onChange={e => setDefaultProductId(e.target.value)} className="form-control">
                <option value="">None (Select Manually)</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Default: ৳{p.price})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Billing Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="form-control" />
          </div>

          {contact.type === 'CUSTOMER' && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-secondary mb-4 uppercase tracking-wider">Customer Specific Rates</h3>
              <p className="text-xs text-secondary mb-4">Set special prices for specific products for this customer. These will override the default product prices in invoices.</p>
              
              <div className="custom-rates-list">
                {customRates.map((rate, index) => (
                  <div key={index} className="custom-rate-row mb-3">
                    <select 
                      value={rate.productId} 
                      onChange={e => handleUpdateCustomRate(index, 'productId', e.target.value)}
                      className="form-control"
                      style={{ flex: 1.5 }}
                    >
                      <option value="">Select Product/Service...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="price-input-wrapper" style={{ flex: 0.8 }}>
                      <span className="currency-prefix">৳</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rate.rate} 
                        onChange={e => handleUpdateCustomRate(index, 'rate', e.target.value)}
                        className="form-control pl-8"
                        placeholder="0.00"
                      />
                    </div>
                    <select 
                      value={rate.vatType || 'EXCLUDE'} 
                      onChange={e => handleUpdateCustomRate(index, 'vatType', e.target.value)}
                      className="form-control"
                      style={{ flex: 0.8 }}
                    >
                      <option value="EXCLUDE">VAT Exclude</option>
                      <option value="INCLUDE">VAT Include</option>
                    </select>
                    {rate.vatType === 'INCLUDE' && (
                      <div style={{ flex: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="number" 
                          step="0.1"
                          value={rate.vatRate || 5} 
                          onChange={e => handleUpdateCustomRate(index, 'vatRate', e.target.value)}
                          className="form-control"
                          placeholder="VAT %"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    )}
                    <button type="button" onClick={() => handleRemoveCustomRate(index)} className="btn-icon text-danger">✖</button>
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={handleAddCustomRate} className="btn btn-secondary btn-sm">+ Add Special Rate</button>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-6 { margin-top: 24px; }
        .mt-8 { margin-top: 32px; }
        .pt-6 { padding-top: 24px; }
        .border-t { border-top: 1px solid var(--border-color); }
        .back-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .back-link:hover { color: var(--brand-primary); }
        
        .form-layout { display: flex; flex-direction: column; gap: 20px; }
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background: var(--bg-primary); }
        .form-control:focus { outline: none; border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1); }
        .pl-8 { padding-left: 32px; }

        .custom-rate-row { display: flex; gap: 12px; align-items: center; }
        .price-input-wrapper { position: relative; display: flex; align-items: center; }
        .currency-prefix { position: absolute; left: 12px; color: var(--text-secondary); font-weight: 600; }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
        .btn-primary { background-color: var(--brand-primary); color: white; box-shadow: 0 4px 12px rgba(67, 24, 255, 0.2); }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background-color: var(--border-color); }
        
        .btn-icon { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 4px; font-size: 1.1rem; color: var(--text-secondary); }
        .btn-icon:hover { background: rgba(0,0,0,0.05); color: var(--danger); }
        
        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        @media (max-width: 600px) {
          .grid-2-col { grid-template-columns: 1fr; }
          .custom-rate-row { flex-direction: column; align-items: stretch; gap: 8px; }
          .custom-rate-row > * { width: 100%; }
        }
      `}</style>
    </div>
  );
}
