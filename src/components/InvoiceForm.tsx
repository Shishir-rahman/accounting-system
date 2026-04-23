'use client'

import { useState, useEffect } from 'react';
import { createInvoice, updateInvoice } from '@/actions/invoice';
import { getProducts } from '@/actions/catalog';
import { useRouter } from 'next/navigation';

export default function InvoiceForm({ contacts, settings, initialData }: { contacts: any[], settings?: any, initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  const [contactId, setContactId] = useState(initialData?.contactId || contacts[0]?.id || '');
  
  const initDate = initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initDate);
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const initDueDate = initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : defaultDueDate.toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(initDueDate);
  
  const [notes, setNotes] = useState(initialData?.notes || settings?.defaultNotes || 'Thank you for your business!');
  const [discountAmount, setDiscountAmount] = useState(initialData?.discountAmount || 0);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);

  const initItems = initialData?.items?.length > 0 
    ? initialData.items.map((i: any) => ({ ...i, id: i.id || Date.now() + Math.random() }))
    : [{ id: 1, productId: '', description: '', quantity: 1, unitPrice: 0 }];

  const [items, setItems] = useState(initItems);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    // Auto-populate default product when contact changes (only for new invoices with empty first row)
    if (contactId && !initialData && products.length > 0) {
      const selectedContact = contacts.find(c => c.id === contactId);
      if (selectedContact && selectedContact.defaultProductId) {
        const product = products.find(p => p.id === selectedContact.defaultProductId);
        if (product) {
          // Check if items are untouched
          if (items.length === 1 && !items[0].productId && !items[0].description) {
            setItems([{
              id: items[0].id,
              productId: product.id,
              description: product.name,
              quantity: 1,
              unitPrice: product.price
            }]);
          }
        }
      }
    }
  }, [contactId, products]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item: any) => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map((item: any) => {
      if (item.id === id) {
        if (field === 'productId') {
          const selectedProduct = products.find(p => p.id === value);
          if (selectedProduct) {
            return { 
              ...item, 
              productId: value as string, 
              description: selectedProduct.name, 
              unitPrice: selectedProduct.price 
            };
          }
          return { ...item, productId: value as string };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = totalAfterDiscount * (taxRate / 100);
  const total = totalAfterDiscount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validItems = items.filter((item: any) => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
    
    if (validItems.length === 0) {
      setError('Please add at least one valid item to the invoice.');
      setLoading(false);
      return;
    }

    if (!contactId) {
      setError('Please select a customer.');
      setLoading(false);
      return;
    }

    const payload = {
      contactId,
      date,
      dueDate,
      notes,
      discountAmount,
      taxRate,
      taxAmount,
      items: validItems.map((item: any) => ({
        productId: item.productId || undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    const res = initialData 
      ? await updateInvoice(initialData.id, payload)
      : await createInvoice(payload);

    if (res.success) {
      router.push(`/invoices/${res.id}`);
    } else {
      setError(res.error || 'Failed to save invoice');
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit Invoice' : 'Create New Invoice'}</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-3-col mb-8">
          <div className="form-group">
            <label>Customer</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)} required className="form-control">
              <option value="">Select Customer</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Invoice Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="form-control" />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="form-control" />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
        <div className="table-responsive mb-4">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Product / Service</th>
                <th style={{ width: '30%' }}>Description</th>
                <th style={{ width: '10%' }} className="text-right">Quantity</th>
                <th style={{ width: '15%' }} className="text-right">Unit Price (৳)</th>
                <th style={{ width: '10%' }} className="text-right">Total (৳)</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <select 
                      value={item.productId} 
                      onChange={e => updateItem(item.id, 'productId', e.target.value)}
                      className="table-input"
                    >
                      <option value="">Custom Item...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      placeholder="Item description" 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      className="table-input"
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="table-input text-right"
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={item.unitPrice} 
                      onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="table-input text-right"
                      required
                    />
                  </td>
                  <td className="text-right font-medium" style={{ paddingRight: '16px' }}>
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => removeItem(item.id)} className="btn-icon text-danger" disabled={items.length <= 1}>✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addItem} className="btn btn-secondary mb-8">+ Add Item</button>

        {/* Footer section with Notes and Totals */}
        <div className="footer-grid">
          <div className="form-group">
            <label>Notes / Terms</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="form-control" 
              rows={4}
              placeholder="Payment terms, thank you message, etc."
            />
          </div>
          
          <div className="totals-box" style={{ width: '100%', maxWidth: '350px', marginLeft: 'auto' }}>
            <div className="totals-row flex justify-between mb-2">
              <span className="text-secondary font-semibold">Subtotal</span>
              <span className="font-semibold">{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="totals-row flex justify-between mb-2 items-center">
              <span className="text-secondary font-semibold">Discount (৳)</span>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                value={discountAmount} 
                onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="form-control text-right"
                style={{ width: '100px', padding: '4px 8px' }}
              />
            </div>
            
            <div className="totals-row flex justify-between mb-2 items-center">
              <span className="text-secondary font-semibold">VAT / TAX (%)</span>
              <input 
                type="number" 
                min="0" 
                max="100"
                step="0.01"
                value={taxRate} 
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="form-control text-right"
                style={{ width: '100px', padding: '4px 8px' }}
              />
            </div>
            
            <div className="totals-row flex justify-between mb-2">
              <span className="text-secondary font-semibold">Tax Amount</span>
              <span className="font-semibold">{taxAmount.toFixed(2)}</span>
            </div>

            <hr className="totals-divider" />
            
            <div className="totals-row flex justify-between">
              <span className="text-lg font-bold">Total (৳)</span>
              <span className="text-lg font-bold text-brand">{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-right mt-8">
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>

      <style>{`
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mt-8 { margin-top: 32px; }
        .grid-3-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .table-responsive { overflow-x: auto; }
        .items-table { width: 100%; border-collapse: collapse; border: 1px solid var(--border-color); }
        .items-table th, .items-table td { padding: 0; border: 1px solid var(--border-color); }
        .items-table th { background-color: var(--bg-secondary); color: var(--text-secondary); padding: 12px 16px; font-weight: 600; font-size: 0.85rem; text-align: left; }
        .items-table td.text-right { padding-right: 16px; }
        
        .table-input { width: 100%; height: 100%; padding: 12px 16px; border: none; background: transparent; font-size: 0.95rem; color: var(--text-primary); outline: none; }
        .table-input:focus { background-color: rgba(67, 24, 255, 0.05); }
        .table-input.text-right { text-align: right; }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background-color: var(--border-color); }
        .btn-large { padding: 14px 28px; font-size: 1.05rem; }
        
        .btn-icon { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 4px; font-size: 1.2rem;}
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
        .totals-box { background-color: var(--bg-secondary); padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1rem; color: var(--text-secondary); }
        .totals-divider { margin: 16px 0; border: none; border-top: 1px solid var(--border-color); }
        .total-amount { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0; }

        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; margin-bottom: 24px; }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        @media (max-width: 768px) {
          .grid-3-col { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>
    </div>
  );
}
