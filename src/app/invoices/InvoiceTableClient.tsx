'use client'

import { useState } from 'react';
import Link from 'next/link';
import { updateInvoiceStatus, sendReminderEmail, sendWarningEmail } from '@/actions/invoice';

export default function InvoiceTableClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  return (
    <div>
      {toast && (
        <div className={`toast-alert alert-${toast.type} mb-4`}>
          {toast.message}
        </div>
      )}

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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-secondary">
                  No invoices found. Create one to get started.
                </td>
              </tr>
            ) : (
              invoices.map(invoice => {
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
                        {!isPaid && (
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
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .flex { display: flex; }
        .justify-end { justify-content: flex-end; }
        .gap-2 { gap: 8px; }
        .items-center { align-items: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .toast-alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; }
        .alert-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.3); }
        .alert-error { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.3); }

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
