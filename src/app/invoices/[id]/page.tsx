import { getInvoiceById } from "@/actions/invoice";
import { getCompanySettings } from "@/actions/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvoiceActions from "@/components/InvoiceActions";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await getInvoiceById(resolvedParams.id);
  const settings = await getCompanySettings();

  if (!invoice) {
    notFound();
  }

  const formatCurrency = (amount: number) => 
    (settings.currency === 'BDT' ? '৳ ' : `${settings.currency} `) + 
    amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <div className="mb-6 no-print">
        <Link href="/invoices" className="back-link">← Back to Invoices</Link>
      </div>

      <div className="layout-grid">
        <div className="invoice-paper">
          {/* Company Header */}
          <div className="invoice-header">
            <div className="company-info-container">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt={`${settings.companyName} Logo`} className="invoice-logo" />
              )}
              <div>
                <h1 className="company-name">{settings.companyName}</h1>
                <p className="company-address text-secondary" style={{ whiteSpace: 'pre-line' }}>
                  {settings.address || 'Company Address Not Set'}
                  {settings.email && `\n${settings.email}`}
                  {settings.phone && `\n${settings.phone}`}
                  {settings.taxId && `\nTax ID: ${settings.taxId}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="invoice-title">INVOICE</h1>
              <div className="invoice-meta">
                <div className="meta-row">
                  <span className="text-secondary">Invoice #:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="meta-row">
                  <span className="text-secondary">Date:</span>
                  <span>{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                {invoice.dueDate && (
                  <div className="meta-row">
                    <span className="text-secondary">Due Date:</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Bill To */}
          <div className="bill-to-section">
            <h3 className="text-secondary text-sm font-bold mb-2">BILL TO</h3>
            <h2 className="text-lg font-bold">{invoice.contact.name}</h2>
            <p className="text-secondary">
              {invoice.contact.address || 'Address not provided'}<br />
              {invoice.contact.email || 'Email not provided'}<br />
              {invoice.contact.phone || 'Phone not provided'}
            </p>
          </div>

          {/* Items Table */}
          <div className="invoice-table-container">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="totals-row">
              <span className="text-secondary">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="totals-row">
                <span className="text-secondary">Discount:</span>
                <span className="text-danger">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="totals-row">
              <span className="text-secondary">Tax ({invoice.taxRate}%):</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="totals-row grand-total">
              <span>Total Due:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="invoice-notes">
              <h3 className="text-secondary text-sm font-bold mb-2">NOTES / TERMS</h3>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="invoice-sidebar no-print">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Invoice Status</h3>
            <div className={`status-banner ${invoice.status.toLowerCase()}`}>
              {invoice.status}
            </div>
            
            <hr className="divider" />
            
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />

            {invoice.status === 'DRAFT' && (
              <div className="mt-4 text-center">
                <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-secondary w-full" style={{ display: 'block' }}>
                  ✏️ Edit Invoice
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 60px; max-width: 1200px; margin: 0 auto; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-4 { margin-top: 16px; }
        .w-full { width: 100%; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .back-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .back-link:hover { color: var(--brand-primary); }

        .layout-grid { display: grid; grid-template-columns: 1fr 350px; gap: 32px; align-items: start; }

        /* Invoice Paper Style */
        .invoice-paper {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          padding: 60px;
          color: #1e293b;
        }

        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .company-info-container { display: flex; flex-direction: column; gap: 16px; }
        .invoice-logo { max-height: 80px; max-width: 200px; object-fit: contain; }
        .company-name { font-size: 1.5rem; font-weight: 800; color: var(--brand-primary); letter-spacing: 1px; margin-bottom: 8px;}
        .company-address { font-size: 0.9rem; line-height: 1.6; }
        
        .invoice-title { font-size: 2.5rem; font-weight: 800; letter-spacing: 4px; color: #cbd5e1; margin-bottom: 16px; }
        .meta-row { display: flex; justify-content: flex-end; gap: 16px; font-size: 0.95rem; margin-bottom: 8px; }

        .divider { border: none; border-top: 2px solid #f1f5f9; margin: 40px 0; }

        .bill-to-section { margin-bottom: 40px; }
        .bill-to-section h2 { margin-bottom: 8px; color: #0f172a; }
        .bill-to-section p { font-size: 0.95rem; line-height: 1.6; }

        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .invoice-table th { background-color: #f8fafc; padding: 12px 16px; text-align: left; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
        .invoice-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
        .invoice-table th.text-right, .invoice-table td.text-right { text-align: right; }

        .invoice-totals { width: 350px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1rem; }
        .grand-total { border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 16px; font-size: 1.25rem; font-weight: 800; color: var(--brand-primary); }

        .invoice-notes { margin-top: 60px; padding: 24px; background-color: #f8fafc; border-radius: var(--radius-sm); border-left: 4px solid var(--brand-primary); }
        .invoice-notes p { font-size: 0.9rem; color: #475569; }

        /* Sidebar Style */
        .status-banner { padding: 16px; border-radius: var(--radius-sm); font-weight: 700; text-align: center; font-size: 1.1rem; letter-spacing: 1px; }
        .status-banner.draft { background-color: #f1f5f9; color: #475569; }
        .status-banner.sent { background-color: #e0f2fe; color: #0284c7; }
        .status-banner.paid { background-color: var(--success-bg); color: var(--success); }

        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; margin: 0; padding: 0; }
          .layout-grid { grid-template-columns: 1fr; display: block; }
          .invoice-paper { box-shadow: none; padding: 0; margin: 0; }
          .page-container { padding: 0; max-width: 100%; margin: 0; }
          .no-print { display: none !important; }
        }

        @media (max-width: 1024px) {
          .layout-grid { grid-template-columns: 1fr; }
          .invoice-sidebar { order: -1; }
        }
      `}</style>
    </div>
  );
}
