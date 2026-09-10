'use client'

import { useState } from 'react';
import Link from 'next/link';
import { updateInvoiceStatus, sendReminderEmail, sendWarningEmail } from '@/actions/invoice';

export default function InvoiceTableClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePaymentStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    const res = await updateInvoiceStatus(id, newStatus);
    if (res.success) {
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
      showToast(`Payment status updated to ${newStatus}`);
    } else {
      showToast(res.error || 'Failed to update status', 'error');
    }
    setLoadingId(null);
  };

  const handleSendReminder = async (id: string, number: string) => {
    if (!confirm(`Send 7-day payment reminder email for invoice ${number}?`)) return;
    setLoadingId(id);
    const res = await sendReminderEmail(id);
    if (res.success) {
      showToast(res.message || 'Reminder email sent successfully!');
    } else {
      showToast(res.error || 'Failed to send reminder email.', 'error');
    }
    setLoadingId(null);
  };

  const handleSendWarning = async (id: string, number: string) => {
    if (!confirm(`Send 15-day URGENT warning email for invoice ${number}?`)) return;
    setLoadingId(id);
    const res = await sendWarningEmail(id);
    if (res.success) {
      showToast(res.message || 'Warning email sent successfully!');
    } else {
      showToast(res.error || 'Failed to send warning email.', 'error');
    }
    setLoadingId(null);
  };

  const formatCurrency = (amount: number) => '৳ ' + (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Extract unique customers
  const uniqueCustomers = Array.from(
    new Map(
      invoices
        .filter((inv: any) => inv.contact)
        .map((inv: any) => [inv.contactId || inv.contact?.id, inv.contact?.name])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  // Extract unique months
  const uniqueMonthsMap = new Map<string, string>();
  invoices.forEach((inv: any) => {
    const dateObj = inv.billingPeriodStart ? new Date(inv.billingPeriodStart) : new Date(inv.date);
    if (!isNaN(dateObj.getTime())) {
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      const label = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      uniqueMonthsMap.set(key, label);
    }
  });
  const uniqueMonths = Array.from(uniqueMonthsMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, label]) => ({ key, label }));

  // Filter invoices
  const filteredInvoices = invoices.filter((inv: any) => {
    // Customer filter
    if (selectedCustomer && inv.contactId !== selectedCustomer && inv.contact?.id !== selectedCustomer) {
      return false;
    }

    // Month filter
    if (selectedMonth) {
      const dateObj = inv.billingPeriodStart ? new Date(inv.billingPeriodStart) : new Date(inv.date);
      if (!isNaN(dateObj.getTime())) {
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (monthKey !== selectedMonth) {
          return false;
        }
      }
    }

    // Status filter
    if (selectedStatus) {
      if (selectedStatus === 'DRAFT' && inv.status !== 'DRAFT') return false;
      if (selectedStatus === 'SENT' && inv.status !== 'SENT') return false;
      if (selectedStatus === 'PAID' && inv.status !== 'PAID') return false;
      if (selectedStatus === 'DUE' && (inv.status === 'PAID' || inv.status === 'DRAFT')) return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const custName = (inv.contact?.name || '').toLowerCase();
      const desc = (inv.items || []).map((i: any) => i.description || i.product?.name).join(' ').toLowerCase();
      if (!invNum.includes(q) && !custName.includes(q) && !desc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const filteredTotalAmount = filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
  const isFiltered = Boolean(selectedCustomer || selectedMonth || selectedStatus || searchQuery);

  return (
    <div>
      {toast && (
        <div className={`toast-alert alert-${toast.type} mb-4`}>
          {toast.message}
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="filter-bar mb-6 p-4 rounded-md border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center" style={{ flex: '1 1 300px' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <input
                type="text"
                placeholder="🔍 Search invoice #, customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Customer Filter */}
            <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="filter-select"
              >
                <option value="">👤 All Customers ({uniqueCustomers.length})</option>
                {uniqueCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Billing Month Filter */}
            <div style={{ flex: '1 1 170px', minWidth: '150px' }}>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">📅 All Months ({uniqueMonths.length})</option>
                {uniqueMonths.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">🏷️ All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="DUE">DUE / UNPAID</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer('');
                  setSelectedMonth('');
                  setSelectedStatus('');
                  setSearchQuery('');
                }}
                className="btn-action btn-edit"
                style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                🔄 Reset
              </button>
            )}
          </div>

          {/* Summary Badge */}
          <div className="text-xs font-semibold text-secondary" style={{ backgroundColor: 'white', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
            Count: <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{filteredInvoices.length}</span> | Total: <span style={{ color: '#059669', fontWeight: 700 }}>{formatCurrency(filteredTotalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Billing Month</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th className="text-center">Invoice Status</th>
              <th className="text-center">Payment Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-secondary">
                  {isFiltered ? (
                    <div>
                      <p className="mb-2 font-medium">No invoices match your selected filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer('');
                          setSelectedMonth('');
                          setSelectedStatus('');
                          setSearchQuery('');
                        }}
                        className="btn-action btn-edit"
                        style={{ padding: '6px 16px', marginTop: '4px' }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    'No invoices found. Create one to get started.'
                  )}
                </td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => {
                // Format Billing Month
                let billingMonthStr = '-';
                if (invoice.billingPeriodStart) {
                  const d = new Date(invoice.billingPeriodStart);
                  billingMonthStr = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                }

                // Format Description
                const descriptions = invoice.items
                  ?.map((i: any) => i.description || i.product?.name)
                  .filter(Boolean)
                  .join(', ');
                const descStr = descriptions || '-';

                // Invoice Status: DRAFT, SENT, or ISSUED
                const invoiceStatusDisplay = invoice.status === 'DRAFT' ? 'DRAFT' : 'SENT';

                // Payment Status: DUE, PAID, OVERDUE
                const isPaid = invoice.status === 'PAID';
                const currentPaymentStatus = isPaid ? 'PAID' : (invoice.status === 'DRAFT' ? 'UNPAID' : 'DUE');

                return (
                  <tr key={invoice.id}>
                    <td className="font-bold">{invoice.invoiceNumber}</td>
                    <td>{new Date(invoice.date).toLocaleDateString('en-GB')}</td>
                    <td className="font-medium">{invoice.contact.name}</td>
                    <td className="text-xs text-secondary">{billingMonthStr}</td>
                    <td className="text-xs" style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={descStr}>
                      {descStr}
                    </td>
                    <td className="text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="text-center">
                      <span className={`badge ${invoiceStatusDisplay === 'DRAFT' ? 'badge-draft' : 'badge-sent'}`}>
                        {invoiceStatusDisplay}
                      </span>
                    </td>
                    <td className="text-center">
                      {isPaid ? (
                        <span className="badge badge-paid">PAID</span>
                      ) : (
                        <select 
                          value={currentPaymentStatus} 
                          onChange={e => handlePaymentStatusChange(invoice.id, e.target.value)}
                          disabled={loadingId === invoice.id}
                          className={`status-select status-${currentPaymentStatus.toLowerCase()}`}
                        >
                          <option value="DUE">DUE / UNPAID</option>
                          <option value="PAID">PAID</option>
                          <option value="OVERDUE">OVERDUE</option>
                        </select>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {invoice.status !== 'SENT' && invoice.status !== 'PAID' && (
                          <Link 
                            href={`/invoices/${invoice.id}/edit`} 
                            className="btn-action btn-edit"
                            title="Edit Invoice"
                          >
                            ✏️ Edit
                          </Link>
                        )}
                        {!isPaid && invoice.status === 'SENT' && (
                          <>
                            <button 
                              type="button" 
                              onClick={() => handleSendReminder(invoice.id, invoice.invoiceNumber)}
                              disabled={loadingId === invoice.id}
                              className="btn-action btn-reminder"
                              title="Send 7-Day Payment Reminder Email"
                            >
                              🔔 Reminder
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleSendWarning(invoice.id, invoice.invoiceNumber)}
                              disabled={loadingId === invoice.id}
                              className="btn-action btn-warning"
                              title="Send 15-Day Overdue Warning Email"
                            >
                              ⚠️ Warning
                            </button>
                          </>
                        )}
                        <Link 
                          href={`/invoices/${invoice.id}`} 
                          className="btn-action btn-view"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .justify-end { justify-content: flex-end; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .gap-4 { gap: 16px; }
        .items-center { align-items: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .toast-alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; }
        .alert-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.3); }
        .alert-error { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.3); }

        .filter-input, .filter-select { width: 100%; padding: 7px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: white; font-size: 0.85rem; outline: none; transition: border-color 0.2s; color: var(--text-primary); }
        .filter-input:focus, .filter-select:focus { border-color: var(--brand-primary); }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .data-table th, .data-table td { padding: 12px 10px; border-bottom: 1px solid var(--border-color); }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); text-align: left; font-weight: 600; font-size: 0.78rem; text-transform: uppercase; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }

        .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
        .badge-sent { background-color: #e0f2fe; color: #0284c7; }
        .badge-draft { background-color: #f1f5f9; color: #475569; }
        .badge-paid { background-color: #10b981; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25); }

        .status-select { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border-color); outline: none; transition: all 0.2s; }
        .status-select option { background-color: #ffffff; color: var(--text-primary); font-weight: 600; }
        .status-due, .status-unpaid { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
        .status-paid { background-color: #10b981; color: #ffffff; border-color: #059669; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); }
        .status-overdue { background-color: #fee2e2; color: #dc2626; border-color: #fecaca; }

        .btn-action { padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-edit { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        .btn-edit:hover { background-color: #e2e8f0; }
        .btn-reminder { background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .btn-reminder:hover:not(:disabled) { background-color: #bae6fd; }
        .btn-warning { background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-warning:hover:not(:disabled) { background-color: #fecaca; }
        .btn-view { background-color: var(--brand-primary); color: white; }
        .btn-view:hover { background-color: var(--brand-primary-hover); }
      `}</style>
    </div>
  );
}
