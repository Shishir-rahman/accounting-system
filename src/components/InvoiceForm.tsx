'use client'

import { useState, useEffect } from 'react';
import { createInvoice, updateInvoice, getLatestInvoiceByCategory } from '@/actions/invoice';
import { getProducts, createProduct } from '@/actions/catalog';
import { getContactRates } from '@/actions/contact';
import { useRouter } from 'next/navigation';

export default function InvoiceForm({ contacts, settings, initialData }: { contacts: any[], settings?: any, initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedContactRates, setSelectedContactRates] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  // Quick Create Product Modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [targetItemIdForNewProduct, setTargetItemIdForNewProduct] = useState<number | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState('SERVICE');
  const [newProdCategory, setNewProdCategory] = useState('MONTHLY_BILLING');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const [contactId, setContactId] = useState(initialData?.contactId || contacts[0]?.id || '');
  const [category, setCategory] = useState(initialData?.category || 'MONTHLY_BILLING');
  
  const initDate = initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initDate);
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const initDueDate = initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : defaultDueDate.toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(initDueDate);
  
  const [notes, setNotes] = useState(initialData?.notes || settings?.defaultNotes || 'Thank you for your business!');
  const [discountAmount, setDiscountAmount] = useState(initialData?.discountAmount || 0);
  const [discountNote, setDiscountNote] = useState(initialData?.discountNote || '');
  const [vatRate, setVatRate] = useState(initialData?.vatRate !== undefined ? initialData.vatRate : 5);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 0);

  const initItems = initialData?.items?.length > 0 
    ? initialData.items.map((i: any) => ({ ...i, id: i.id || Date.now() + Math.random() }))
    : [{ id: 1, productId: '', description: '', quantity: 1, unitPrice: 0, vatType: 'EXCLUDE', vatRate: 5 }];

  const [items, setItems] = useState(initItems);

  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    
    const isPriceOptional = newProdCategory === 'IMPLEMENTATION' || newProdCategory === 'PROJECT';
    const payload = {
      name: newProdName,
      type: newProdType,
      category: newProdCategory || undefined,
      price: isPriceOptional ? 0 : (parseFloat(newProdPrice) || 0),
      description: newProdDesc
    };

    const res = await createProduct(payload);
    if (res.success && res.product) {
      setProducts(prev => [...prev, res.product]);
      
      // Auto select this newly created product for target item row
      if (targetItemIdForNewProduct !== null) {
        updateItem(targetItemIdForNewProduct, 'productId', res.product.id);
      }
      
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdDesc('');
    }
    setIsCreatingProduct(false);
  };

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

  const initStartEnd = getMonthRange(initBillingMonth);
  const [billingPeriodStart, setBillingPeriodStart] = useState(
    initialData?.billingPeriodStart 
      ? new Date(initialData.billingPeriodStart).toISOString().split('T')[0] 
      : initStartEnd.start
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(
    initialData?.billingPeriodEnd 
      ? new Date(initialData.billingPeriodEnd).toISOString().split('T')[0] 
      : initStartEnd.end
  );

  const handleMonthChange = (monthStr: string) => {
    setBillingMonth(monthStr);
    const { start, end } = getMonthRange(monthStr);
    setBillingPeriodStart(start);
    setBillingPeriodEnd(end);
  };

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (contactId) {
      getContactRates(contactId).then(rates => {
        setSelectedContactRates(rates);
      });

      // Auto-populate based on category & customer for new invoices
      if (!initialData && category) {
        getLatestInvoiceByCategory(contactId, category).then(res => {
          if (res.success && res.invoice && res.invoice.items && res.invoice.items.length > 0) {
            // Found previous invoice for this category! Pre-populate details from it
            setItems(res.invoice.items.map((item: any) => {
              const vType = item.vatType || 'EXCLUDE';
              const vRate = item.vatRate !== undefined && item.vatRate > 0 ? item.vatRate : (vType === 'EXCLUDE' ? 5 : 0);
              return {
                id: Date.now() + Math.random(),
                productId: item.productId || '',
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatType: vType,
                vatRate: vRate
              };
            }));
          } else {
            // No previous invoice in this category. Check if contact has a default product matching this category
            const selectedContact = contacts.find(c => c.id === contactId);
            const defaultProdId = selectedContact?.defaultProductId;
            
            if (defaultProdId && products.length > 0) {
              const product = products.find(p => p.id === defaultProdId);
              if (product && (product.category === category || (!product.category && category === 'MONTHLY_BILLING'))) {
                getContactRates(contactId).then(rates => {
                  const customData = rates.find((r: any) => r.productId === defaultProdId);
                  const priceToUse = customData ? customData.rate : product.price;
                  const descriptionToUse = customData?.lastDescription || product.name;
                  const vType = customData?.vatType || 'EXCLUDE';
                  const vRate = customData?.vatRate !== undefined && customData.vatRate > 0 ? customData.vatRate : (vType === 'EXCLUDE' ? 5 : 0);

                  setItems([{
                    id: Date.now(),
                    productId: product.id,
                    description: descriptionToUse,
                    quantity: 1,
                    unitPrice: priceToUse,
                    vatType: vType,
                    vatRate: vRate
                  }]);
                });
                return;
              }
            }

            // Default blank item for Implementation / Project or unmatched categories
            setItems([{
              id: Date.now(),
              productId: '',
              description: '',
              quantity: 1,
              unitPrice: 0,
              vatType: 'EXCLUDE',
              vatRate: 5
            }]);
          }
        });
      }
    } else {
      setSelectedContactRates([]);
    }
  }, [contactId, category, products, contacts, initialData]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: '', description: '', quantity: 1, unitPrice: 0, vatType: 'EXCLUDE', vatRate: 5 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item: any) => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map((item: any) => {
      if (item.id === id) {
        if (field === 'productId') {
          const product = products.find((p: any) => p.id === value);
          if (product) {
            const customData = selectedContactRates.find((r: any) => r.productId === value);
            const priceToUse = customData ? customData.rate : product.price;
            const descriptionToUse = customData?.lastDescription || product.name;
            const vType = customData?.vatType || 'EXCLUDE';
            const vRate = customData?.vatRate !== undefined && customData.vatRate > 0 ? customData.vatRate : (vType === 'EXCLUDE' ? 5 : 0);
            return { 
              ...item, 
              productId: value as string, 
              description: descriptionToUse, 
              unitPrice: priceToUse,
              vatType: vType,
              vatRate: vRate
            };
          }
          return { ...item, productId: value as string };
        }
        if (field === 'vatType') {
          const newVatRate = value === 'EXCLUDE' ? (item.vatRate || 5) : item.vatRate;
          return { ...item, vatType: value, vatRate: newVatRate };
        }
        if (field === 'vatRate') {
          return { ...item, vatRate: Number(value) || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  
  // Calculate VAT per item (INCLUDE extracts portion, EXCLUDE adds on top)
  const excludeVatSum = items.reduce((sum: number, item: any) => {
    if (item.vatType === 'EXCLUDE' && item.vatRate > 0) {
      return sum + (item.quantity * item.unitPrice * (item.vatRate / 100));
    }
    return sum;
  }, 0);

  const includeVatSum = items.reduce((sum: number, item: any) => {
    if (item.vatType === 'INCLUDE' && item.vatRate > 0) {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + (lineTotal - (lineTotal / (1 + item.vatRate / 100)));
    }
    return sum;
  }, 0);

  const individualVat = excludeVatSum + includeVatSum;
  const vatAmount = excludeVatSum;
  const taxAmount = totalAfterDiscount * (taxRate / 100);
  const total = totalAfterDiscount + excludeVatSum + taxAmount;

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

    const hasPeriodCategory = items.some((item: any) => {
      const p = products.find((prod: any) => prod.id === item.productId);
      return !p || !p.category || p.category === 'MONTHLY_BILLING' || p.category === 'ADVANCE_ANALYTICS';
    });
    const showBillingMonth = category === 'COMBINED' || category === 'MONTHLY_BILLING' || category === 'ADVANCE_ANALYTICS' || hasPeriodCategory;

    const payload = {
      contactId,
      category,
      date,
      dueDate,
      billingPeriodStart: showBillingMonth ? billingPeriodStart : undefined,
      billingPeriodEnd: showBillingMonth ? billingPeriodEnd : undefined,
      notes,
      discountAmount,
      discountNote: discountAmount > 0 ? discountNote : undefined,
      vatRate,
      vatAmount,
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

  const hasPeriodCategory = items.some((item: any) => {
    const p = products.find((prod: any) => prod.id === item.productId);
    return !p || !p.category || p.category === 'MONTHLY_BILLING' || p.category === 'ADVANCE_ANALYTICS';
  });
  const showBillingMonth = category === 'COMBINED' || category === 'MONTHLY_BILLING' || category === 'ADVANCE_ANALYTICS' || hasPeriodCategory;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit Invoice' : 'Create New Invoice'}</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-4-col mb-6">
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
            <label>Billing Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required className="form-control">
              <option value="COMBINED">Combined / Multiple Categories</option>
              <option value="MONTHLY_BILLING">Monthly billing</option>
              <option value="ADVANCE_ANALYTICS">Advance analytics</option>
              <option value="IMPLEMENTATION">Implementation</option>
              <option value="PROJECT">Project</option>
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

        {showBillingMonth && (
          <div className="grid-3-col mb-8 p-4 rounded bg-secondary-subtle" style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <div className="form-group">
              <label>Billing Month (Quick Select)</label>
              <input type="month" value={billingMonth} onChange={e => handleMonthChange(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label>Period Start Date</label>
              <input type="date" value={billingPeriodStart} onChange={e => setBillingPeriodStart(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Period End Date</label>
              <input type="date" value={billingPeriodEnd} onChange={e => setBillingPeriodEnd(e.target.value)} required className="form-control" />
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
        <div className="table-responsive mb-4">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: showBillingMonth ? '22%' : '25%' }}>Product / Service</th>
                {showBillingMonth && <th style={{ width: '18%' }}>Billing Period</th>}
                <th style={{ width: showBillingMonth ? '25%' : '35%' }}>Description</th>
                <th style={{ width: '10%' }} className="text-right">Qty</th>
                <th style={{ width: showBillingMonth ? '12%' : '15%' }} className="text-right">Unit Price (৳)</th>
                <th style={{ width: showBillingMonth ? '10%' : '12%' }} className="text-right">Total (৳)</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const itemProd = products.find(p => p.id === item.productId);
                const isNoPeriodProd = itemProd && (itemProd.category === 'IMPLEMENTATION' || itemProd.category === 'PROJECT');

                const formatDateDisplay = (dateStr: string) => {
                  if (!dateStr) return '';
                  const d = new Date(dateStr);
                  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                };
                const periodDisplay = (!isNoPeriodProd && billingPeriodStart && billingPeriodEnd) 
                  ? `${formatDateDisplay(billingPeriodStart)} to ${formatDateDisplay(billingPeriodEnd)}`
                  : '-';

                return (
                  <tr key={item.id}>
                    <td>
                      <select 
                        value={item.productId} 
                        onChange={e => {
                          if (e.target.value === '__CREATE_NEW__') {
                            setTargetItemIdForNewProduct(item.id);
                            setShowAddProductModal(true);
                          } else {
                            updateItem(item.id, 'productId', e.target.value);
                          }
                        }}
                        className="table-input"
                      >
                        <option value="">Custom Item...</option>
                        <option value="__CREATE_NEW__" style={{ fontWeight: '600', color: 'var(--brand-primary)' }}>
                          ➕ Add New Product / Service...
                        </option>
                        {products.map(p => {
                          const catLabel = p.category === 'MONTHLY_BILLING' ? 'Monthly' :
                                           p.category === 'ADVANCE_ANALYTICS' ? 'Analytics' :
                                           p.category === 'IMPLEMENTATION' ? 'Implementation' :
                                           p.category === 'PROJECT' ? 'Project' : 'Standard';
                          return (
                            <option key={p.id} value={p.id}>
                              [{catLabel}] {p.name}
                            </option>
                          );
                        })}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '0 4px 4px 4px' }}>
                        <select 
                          value={item.vatType || 'EXCLUDE'} 
                          onChange={e => updateItem(item.id, 'vatType', e.target.value)}
                          style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="EXCLUDE">VAT Extra (+)</option>
                          <option value="INCLUDE">Including VAT (Incl.)</option>
                        </select>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VAT:</span>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.1"
                          value={item.vatRate ?? 0} 
                          onChange={e => updateItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                          style={{ width: '48px', padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>%</span>
                      </div>
                    </td>
                    {showBillingMonth && (
                      <td className="text-xs text-secondary" style={{ verticalAlign: 'middle', padding: '12px 16px' }}>
                        {periodDisplay}
                      </td>
                    )}
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
          
          <div className="totals-box" style={{ width: '100%', maxWidth: '380px', marginLeft: 'auto' }}>
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
                style={{ width: '110px', padding: '4px 8px' }}
              />
            </div>

            {discountAmount > 0 && (
              <div className="mb-3">
                <input 
                  type="text" 
                  placeholder="Discount Details / Reason" 
                  value={discountNote} 
                  onChange={e => setDiscountNote(e.target.value)} 
                  className="form-control"
                  style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                />
              </div>
            )}

            {items.some((i: any) => i.vatType === 'EXCLUDE') && (
              <div className="totals-row flex justify-between mb-2 items-center">
                <span className="text-secondary font-semibold">VAT (%)</span>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  step="0.01"
                  value={vatRate} 
                  onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                  className="form-control text-right"
                  style={{ width: '110px', padding: '4px 8px' }}
                />
              </div>
            )}

            {vatAmount > 0 && (
              <div className="totals-row flex justify-between mb-2">
                <span className="text-secondary font-semibold">VAT Amount</span>
                <span className="font-semibold">{vatAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="totals-row flex justify-between mb-2 items-center">
              <span className="text-secondary font-semibold">TAX / AIT (%)</span>
              <input 
                type="number" 
                min="0" 
                max="100"
                step="0.01"
                value={taxRate} 
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="form-control text-right"
                style={{ width: '110px', padding: '4px 8px' }}
              />
            </div>
            
            {taxAmount > 0 && (
              <div className="totals-row flex justify-between mb-2">
                <span className="text-secondary font-semibold">TAX Amount</span>
                <span className="font-semibold">{taxAmount.toFixed(2)}</span>
              </div>
            )}

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

      {showAddProductModal && (
        <div className="quick-modal-backdrop">
          <div className="quick-modal-card card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Product / Service</h3>
              <button type="button" onClick={() => setShowAddProductModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleQuickCreateProduct}>
              <div className="grid-2-col gap-4 mb-4">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={newProdName} 
                    onChange={e => setNewProdName(e.target.value)} 
                    required 
                    placeholder="e.g. Analytics Setup" 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={newProdType} onChange={e => setNewProdType(e.target.value)} className="form-control">
                    <option value="SERVICE">Service</option>
                    <option value="PRODUCT">Product</option>
                  </select>
                </div>
              </div>

              <div className="grid-2-col gap-4 mb-4">
                <div className="form-group">
                  <label>Billing Category</label>
                  <select value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} className="form-control">
                    <option value="MONTHLY_BILLING">Monthly billing</option>
                    <option value="ADVANCE_ANALYTICS">Advance analytics</option>
                    <option value="IMPLEMENTATION">Implementation</option>
                    <option value="PROJECT">Project</option>
                    <option value="">None / Standard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Price (৳) {(newProdCategory === 'IMPLEMENTATION' || newProdCategory === 'PROJECT') ? '(Optional)' : ''}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={newProdPrice} 
                    onChange={e => setNewProdPrice(e.target.value)} 
                    required={newProdCategory !== 'IMPLEMENTATION' && newProdCategory !== 'PROJECT'} 
                    className="form-control" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="form-group mb-6">
                <label>Description (Optional)</label>
                <input 
                  type="text" 
                  value={newProdDesc} 
                  onChange={e => setNewProdDesc(e.target.value)} 
                  className="form-control" 
                  placeholder="Short product description" 
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingProduct} className="btn btn-primary">
                  {isCreatingProduct ? 'Saving...' : 'Save & Select Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mt-8 { margin-top: 32px; }
        .grid-2-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .grid-3-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .grid-4-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .grid-5-col { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        .gap-3 { gap: 12px; }
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
        .btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-secondary); }
        
        .btn-icon { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 4px; font-size: 1.2rem;}
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
        .totals-box { background-color: var(--bg-secondary); padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1rem; color: var(--text-secondary); }
        .totals-divider { margin: 16px 0; border: none; border-top: 1px solid var(--border-color); }
        .total-amount { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0; }

        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; margin-bottom: 24px; }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        .quick-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .quick-modal-card { width: 100%; max-width: 500px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }

        @media (max-width: 1024px) {
          .grid-3-col, .grid-4-col, .grid-5-col { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>
    </div>
  );
}
