'use client'

import { useState, useEffect } from 'react';
import { createInvoice, updateInvoice } from '@/actions/invoice';
import { getProducts } from '@/actions/catalog';
import { getContactRates } from '@/actions/contact';
import { useRouter } from 'next/navigation';

export default function InvoiceForm({ contacts, settings, initialData }: { contacts: any[], settings?: any, initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedContactRates, setSelectedContactRates] = useState<any[]>([]);
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
    : [{ id: 1, productId: '', description: '', quantity: 1, unitPrice: 0, vatType: 'EXCLUDE', vatRate: 0 }];

  const [items, setItems] = useState(initItems);

  // Billing Period Logic
  const getMonthRange = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    const format = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return { 
      start: format(start), 
      end: format(end) 
    };
  };

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const defaultMonth = lastMonth.toISOString().slice(0, 7);
  const initBillingMonth = initialData?.billingPeriodStart 
    ? new Date(initialData.billingPeriodStart).toISOString().slice(0, 7) 
    : defaultMonth;
  
  const [billingMonth, setBillingMonth] = useState(initBillingMonth);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (contactId) {
      getContactRates(contactId).then(rates => {
        setSelectedContactRates(rates);
        
        // Auto-populate default product when contact changes
        // Condition: If it's a new invoice AND (it's the first load OR the user hasn't added more items)
        if (!initialData && products.length > 0 && items.length <= 1) {
          const selectedContact = contacts.find(c => c.id === contactId);
          const defaultProdId = selectedContact?.defaultProductId;
          
          if (defaultProdId) {
            const product = products.find(p => p.id === defaultProdId);
            if (product) {
              const customData = rates.find((r: any) => r.productId === defaultProdId);
              const priceToUse = customData ? customData.rate : product.price;
              const descriptionToUse = customData?.lastDescription || product.name;
              
              setItems([{
                id: items[0]?.id || Date.now(),
                productId: product.id,
                description: descriptionToUse,
                quantity: 1,
                unitPrice: priceToUse,
                vatType: customData?.vatType || 'EXCLUDE',
                vatRate: customData?.vatRate || 0
              }]);
              if (customData?.vatType === 'EXCLUDE') {
                setTaxRate(customData.vatRate || 0);
              } else if (customData?.vatType === 'INCLUDE') {
                setTaxRate(0);
              }
            }
          }
        }
      });
    } else {
      setSelectedContactRates([]);
    }
  }, [contactId, products, contacts, initialData]);

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
            // Check for custom rate/description for this customer from our fresh rates
            const customData = selectedContactRates.find((r: any) => r.productId === value);
            const priceToUse = customData ? customData.rate : selectedProduct.price;
            const descriptionToUse = customData?.lastDescription || selectedProduct.name;

            return { 
              ...item, 
              productId: value as string, 
              description: descriptionToUse, 
              unitPrice: priceToUse,
              vatType: customData?.vatType || 'EXCLUDE',
              vatRate: customData?.vatRate || 0
            };
          }
          return { ...item, productId: value as string };
        }
        if (field === 'vatType') {
          if (value === 'EXCLUDE') {
            setTaxRate(item.vatRate || 0);
          } else {
            setTaxRate(0);
          }
        }
        if (field === 'vatRate' && item.vatType === 'EXCLUDE') {
          setTaxRate(Number(value) || 0);
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  
  // Calculate tax: ONLY sum up EXCLUDE VAT items.
  const individualTax = items.reduce((sum: number, item: any) => {
    if (item.vatType === 'EXCLUDE' && item.vatRate > 0) {
      return sum + (item.quantity * item.unitPrice * (item.vatRate / 100));
    }
    return sum;
  }, 0);

  // If there are any EXCLUDE items, use their sum. 
  // Otherwise, use the global taxRate ONLY if no items are explicitly set to INCLUDE.
  const hasIncludeVat = items.some((i: any) => i.vatType === 'INCLUDE');
  const taxAmount = individualTax > 0 ? individualTax : (hasIncludeVat ? 0 : (totalAfterDiscount * (taxRate / 100)));
  const total = totalAfterDiscount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validItems = items.filter((item: any) => (item.productId || item.description.trim() !== '') && item.quantity > 0 && item.unitPrice > 0);
    
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

    const { start: billingPeriodStart, end: billingPeriodEnd } = getMonthRange(billingMonth);

    const payload = {
      contactId,
      date,
      dueDate,
      billingPeriodStart,
      billingPeriodEnd,
      notes,
      discountAmount,
      taxRate,
      taxAmount,
      items: validItems.map((item: any) => ({
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatType: item.vatType || 'EXCLUDE',
        vatRate: item.vatRate || 0
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
        <div className="grid-4-col mb-8">
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
          <div className="form-group">
            <label>Billing Month</label>
            <input type="month" value={billingMonth} onChange={e => setBillingMonth(e.target.value)} required className="form-control" />
            <p className="text-xs text-secondary mt-1">
              Period: {getMonthRange(billingMonth).start} to {getMonthRange(billingMonth).end}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
        <div className="table-responsive mb-4">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Product / Service</th>
                <th style={{ width: '20%' }}>Billing Period</th>
                <th style={{ width: '25%' }}>Description</th>
                <th style={{ width: '10%' }} className="text-right">Qty</th>
                <th style={{ width: '12%' }} className="text-right">Unit Price (৳)</th>
                <th style={{ width: '10%' }} className="text-right">Total (৳)</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const { start, end } = getMonthRange(billingMonth);
                const formatDate = (dateStr: string) => {
                  const d = new Date(dateStr);
                  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                };
                const periodDisplay = `${formatDate(start)} to ${formatDate(end)}`;

                return (
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
                      {item.vatType === 'INCLUDE' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                          (Including VAT {item.vatRate}%)
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-secondary" style={{ verticalAlign: 'middle', padding: '12px 16px' }}>
                      {periodDisplay}
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Item description" 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        className="table-input"
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
                );
              })}
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
        .grid-4-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
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
          .grid-4-col { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>
    </div>
  );
}
