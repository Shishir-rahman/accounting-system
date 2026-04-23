'use client'

import { useState, useEffect } from 'react';
import { getSalesReport } from '@/actions/report';
import { getContactsByType } from '@/actions/contact';
import { getProducts } from '@/actions/catalog';
import Link from 'next/link';

export default function SalesReportPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [productId, setProductId] = useState('');

  // Dropdown options
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Load dropdown options on mount
    async function init() {
      const [custData, prodData] = await Promise.all([
        getContactsByType('CUSTOMER'),
        getProducts()
      ]);
      setCustomers(custData);
      setProducts(prodData);
      
      // Initially load this month's data
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
      
      fetchReport(firstDay, lastDay, '', '');
    }
    init();
  }, []);

  const fetchReport = async (start: string, end: string, customer: string, product: string) => {
    setLoading(true);
    const res = await getSalesReport({
      startDate: start || undefined,
      endDate: end || undefined,
      contactId: customer || undefined,
      productId: product || undefined
    });

    if (res.success) {
      setReportData(res.data);
    }
    setLoading(false);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(startDate, endDate, contactId, productId);
  };

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">Sales Report</h1>
        <p className="text-secondary text-base">Analyze your revenue by date, customer, and product.</p>
      </header>

      {/* Filters Card */}
      <div className="card mb-8">
        <form onSubmit={handleGenerate} className="filter-grid">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" />
          </div>
          <div className="form-group">
            <label>Customer</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)} className="form-control">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Product / Service</label>
            <select value={productId} onChange={e => setProductId(e.target.value)} className="form-control">
              <option value="">All Products/Services</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group flex items-end">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>

      {loading && <div className="text-center py-8 text-secondary">Loading report data...</div>}

      {!loading && reportData && (
        <>
          {/* Summary Widgets */}
          <div className="stats-grid mb-8">
            <div className="stat-card">
              <div className="stat-title">Net Sales (Revenue)</div>
              <div className="stat-value text-success">{formatCurrency(reportData.netSales)}</div>
              <div className="stat-desc">Before Tax, After Discounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Gross Revenue</div>
              <div className="stat-value">{formatCurrency(reportData.totalRevenue)}</div>
              <div className="stat-desc">Total billed amount</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Total Invoices</div>
              <div className="stat-value">{reportData.totalInvoices}</div>
              <div className="stat-desc">Matching criteria</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Items Sold</div>
              <div className="stat-value">{reportData.totalItemsSold}</div>
              <div className="stat-desc">Unit quantity</div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Invoice Breakdown</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer Name</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-secondary">No sales found for the selected criteria.</td>
                    </tr>
                  ) : (
                    reportData.invoices.map((inv: any) => (
                      <tr key={inv.id}>
                        <td>{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="font-bold text-brand"><Link href={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link></td>
                        <td>{inv.customerName}</td>
                        <td className="text-center">
                          <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : 'badge-info'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="text-right font-medium">{formatCurrency(inv.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-4 { margin-bottom: 16px; }
        .mb-8 { margin-bottom: 32px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .w-full { width: 100%; }
        
        .filter-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; align-items: end; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); }
        
        .btn { padding: 10px 16px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; height: 42px; display: flex; align-items: center; justify-content: center;}
        .btn-primary { background-color: var(--brand-primary); color: white; transition: background-color 0.2s;}
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .stat-card { background-color: var(--bg-secondary); padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); }
        .stat-title { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
        .stat-value { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
        .stat-desc { font-size: 0.8rem; color: var(--text-secondary); }
        
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
        .data-table td.text-right { text-align: right; }
        .data-table th.text-right { text-align: right; }
        .data-table td.text-center { text-align: center; }
        .data-table th.text-center { text-align: center; }
        
        .text-brand { color: var(--brand-primary); }
        .text-success { color: var(--success); }
        
        .badge { display: inline-block; padding: 4px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;}
        .badge-success { background-color: var(--success-bg); color: var(--success); }
        .badge-info { background-color: rgba(67, 24, 255, 0.1); color: var(--brand-primary); }

        @media (max-width: 1024px) {
          .filter-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .filter-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
