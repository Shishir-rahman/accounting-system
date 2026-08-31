export const dynamic = 'force-dynamic';
export const revalidate = 5;

import { getInvoiceById } from "@/actions/invoice";
import { getCompanySettings } from "@/actions/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvoiceActions from "@/components/InvoiceActions";
import { numberToWords } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await getInvoiceById(resolvedParams.id);
  if (!invoice) return { title: 'Invoice' };
  const clientName = invoice.contact?.name ? invoice.contact.name.replace(/[/\\?%*:|"<>]/g, ' ') : 'Invoice';
  return {
    title: `${clientName} ${invoice.invoiceNumber}`,
  };
}

const INVOICE_STYLES = `
  .page-container { padding-bottom: 60px; max-width: 1200px; margin: 0 auto; }
  .fade-in { animation: fadeIn 0.4s ease-in-out; }
  .mb-6 { margin-bottom: 24px; }
  .mt-1 { margin-top: 4px; }
  .text-right { text-align: right !important; }
  .text-sm { font-size: 0.875rem; }
  .font-bold { font-weight: 700; }
  .text-secondary { color: #64748b; }
  
  .back-link { color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
  .back-link:hover { color: var(--brand-primary); }

  .layout-grid { display: grid; grid-template-columns: 1fr 350px; gap: 32px; align-items: start; }

  /* Invoice Paper Style */
  .invoice-paper {
    background: white;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    padding: 60px;
    color: #1e293b;
    min-height: 800px;
  }

  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-info-right { text-align: right; }
  .company-name-standard { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  .invoice-title-standard { font-size: 1rem; font-weight: 700; letter-spacing: 3px; color: #7ba7d4; text-align: center; width: 100%; display: block; margin: 10px 0 4px 0; }
  .invoice-logo-left { max-height: 80px; max-width: 180px; object-fit: contain; }
  
  .header-divider { height: 2px; background-color: #f1f5f9; margin: 20px 0 30px 0; }
  .section-header-underlined { font-size: 0.95rem; font-weight: 700; color: #1e293b; border-bottom: 1px solid #64748b; padding-bottom: 2px; display: inline-block; width: 100%; margin-bottom: 8px; }
  .mt-6 { margin-top: 24px; }
  .mt-2 { margin-top: 8px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .section-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
  .customer-name { font-size: 1.25rem; font-weight: 700; margin: 4px 0; color: #0f172a; }
  
  .meta-info-standard { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
  .meta-item { display: flex; gap: 12px; font-size: 0.95rem; }
  .meta-item .section-label { width: 100px; text-align: right; margin-top: 2px; }

  .table-wrapper { margin-bottom: 40px; border: 2px solid #1e293b; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .standard-table { width: 100%; border-collapse: collapse; }
  .standard-table th { background-color: #e2e8f0; padding: 13px 16px; text-align: left; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #1e293b; border-right: 1px solid #334155; }
  .standard-table th:last-child { border-right: none; }
  .standard-table td { padding: 14px 16px; border-bottom: 1px solid #cbd5e1; font-size: 0.95rem; border-right: 1px solid #cbd5e1; color: #0f172a; }
  .standard-table td:last-child { border-right: none; }
  .standard-table tr:last-child td { border-bottom: none; }
  .standard-table tbody tr:nth-child(even) { background-color: #f8fafc; }
  .standard-table tbody tr:hover { background-color: #f1f5f9; }

  .bottom-grid { display: grid; grid-template-columns: 1fr 300px; gap: 40px; }
  
  .in-words { margin-bottom: 30px; }
  .payment-info-box { padding-top: 20px; border-top: 1px solid #f1f5f9; }
  
  .totals-box { display: flex; flex-direction: column; gap: 12px; }
  .total-row-standard { display: flex; justify-content: space-between; font-size: 0.95rem; color: #334155; }
  .grand-total-standard { display: flex; justify-content: space-between; margin-top: 12px; padding: 12px 16px; background-color: #e2e8f0; font-size: 1.15rem; font-weight: 800; color: #0f172a; border: 2px solid #1e293b; border-radius: 6px; }

  /* Sidebar Style */
  .status-banner { padding: 16px; border-radius: var(--radius-sm); font-weight: 700; text-align: center; font-size: 1.1rem; letter-spacing: 1px; }
  .status-banner.draft { background-color: #f1f5f9; color: #475569; }
  .status-banner.sent { background-color: #e0f2fe; color: #0284c7; }
  .status-banner.paid { background-color: var(--success-bg); color: var(--success); }

  @media print {
    @page { margin: 0; size: auto; }
    body { background: white; margin: 0; padding: 0; }
    .layout-grid { grid-template-columns: 1fr; display: block; }
    .invoice-paper { box-shadow: none; padding: 40px; margin: 0; width: 100%; }
    .page-container { padding: 0; max-width: 100%; margin: 0; }
    .no-print { display: none !important; }
    .table-wrapper { border: 2px solid #000000 !important; border-radius: 0 !important; }
    .standard-table th { background-color: #e2e8f0 !important; color: #000000 !important; border-bottom: 2px solid #000000 !important; border-right: 1px solid #000000 !important; }
    .standard-table td { border-bottom: 1px solid #000000 !important; border-right: 1px solid #000000 !important; color: #000000 !important; }
    .grand-total-standard { border: 2px solid #000000 !important; background-color: #e2e8f0 !important; color: #000000 !important; }
  }

  @media (max-width: 1024px) {
    .layout-grid { grid-template-columns: 1fr; }
    .invoice-sidebar { order: -1; }
  }
`;

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await getInvoiceById(resolvedParams.id);
  const settings = await getCompanySettings();

  if (!invoice) {
    notFound();
  }

  const formatCurrency = (amount: number) => 
    (settings.currency === 'BDT' ? '৳ ' : `${settings.currency} `) + 
    (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <div className="mb-6 no-print">
        <Link href="/invoices" className="back-link">← Back to Invoices</Link>
      </div>

      <div className="layout-grid">
        <div className="invoice-paper">
          {/* Header */}
          <div className="invoice-header">
            <div className="logo-container-standard">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="invoice-logo-left" />
              )}
            </div>
            <div className="company-info-right">
              <h1 className="company-name-standard">{settings?.companyName || 'Sokrio Technologies Ltd.'}</h1>
              <p className="text-secondary text-sm">
                {settings?.address || 'House 11 (4th floor), Road 21, Sector 4, Uttara, Dhaka - 1230'}<br/>
                {settings?.phone ? `Phone: ${settings.phone} | ` : ''}Website: www.sokrio.com
              </p>
            </div>
          </div>

          <div className="header-divider" />
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span className="invoice-title-standard">INVOICE</span>
          </div>

          {/* Info Section */}
          <div className="info-grid">
            <div className="bill-to-standard">
              <h3 className="section-label">BILL TO:</h3>
              <h2 className="customer-name">{invoice.contact.name}</h2>
              {!!(invoice.customerBin || invoice.contact?.binNumber) && (
                <p className="text-sm font-bold text-secondary" style={{ marginTop: '2px', marginBottom: '4px' }}>
                  BIN: {invoice.customerBin || invoice.contact?.binNumber}
                </p>
              )}
              <p className="text-secondary text-sm whitespace-pre-line">
                {invoice.contact.address || 'Address not provided'}
              </p>
            </div>
            <div className="meta-info-standard">
              <div className="meta-item">
                <span className="section-label">Invoice No:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="meta-item">
                <span className="section-label">Date:</span>
                <span>{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
              </div>
              {invoice.dueDate && (
                <div className="meta-item">
                  <span className="section-label">Due Date:</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {(() => {
            const hasDesc = invoice.items.some((i: any) => i.description && i.description.trim() !== '' && i.description.trim() !== i.product?.name?.trim());
            return (
              <div className="table-wrapper">
                <table className="standard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Product / Service</th>
                      {invoice.billingPeriodStart && <th style={{ width: '25%' }}>Billing Period</th>}
                      {hasDesc && <th style={{ width: '25%' }}>Description</th>}
                      <th className="text-right" style={{ width: '10%' }}>Qty</th>
                      <th className="text-right" style={{ width: '10%' }}>Unit Price</th>
                      <th className="text-right" style={{ width: '10%' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, index: number) => {
                      const formatDate = (dateStr: any) => {
                        if (!dateStr) return '';
                        const d = new Date(dateStr);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      };
                      const isNoPeriod = item.product && (item.product.category === 'IMPLEMENTATION' || item.product.category === 'PROJECT');
                      const period = (!isNoPeriod && invoice.billingPeriodStart && invoice.billingPeriodEnd)
                        ? `${formatDate(invoice.billingPeriodStart)} to ${formatDate(invoice.billingPeriodEnd)}`
                        : '-';

                      return (
                        <tr key={index}>
                          <td>
                            <div className="font-medium">{item.product?.name || 'Custom'}</div>
                            {item.vatType === 'INCLUDE' && (
                              <div className="text-xs text-secondary italic">
                                (Including VAT {item.vatRate}%)
                              </div>
                            )}
                          </td>
                          {invoice.billingPeriodStart && <td>{period}</td>}
                          {hasDesc && <td>{item.description}</td>}
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Bottom Section */}
          <div className="bottom-grid">
            <div className="words-and-payment">
              <div className="in-words">
                <span className="section-label">In Words:</span>
                <p className="font-bold text-sm mt-1">{numberToWords(invoice.totalAmount)}</p>
              </div>
              
              <div className="payment-info-section-standard">
                <h3 className="section-header-underlined">Payment Info:</h3>
                <div className="text-sm mt-2">
                  <p className="font-bold">Bank Details:</p>
                  <p>Account Name: Sokrio Technologies Ltd.</p>
                  <p>A/C number: 0832101000024879</p>
                  <p>Bank Name: UCB</p>
                  <p>Branch Name: Uttara</p>
                  <p>Routing Number: 245264630</p>
                  <p className="mt-2">Or</p>
                  <p>bKash Merchant Number: 01798 013530</p>
                </div>
              </div>

              <div className="terms-section-standard mt-6">
                <h3 className="section-header-underlined">Terms & Conditions:</h3>
                <p className="text-sm mt-2">Payment Method: Bank & bKash</p>
              </div>
            </div>

            <div className="totals-box">
              <div className="total-row-standard">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="total-row-standard">
                  <span>Discount {invoice.discountNote ? `(${invoice.discountNote})` : ''}:</span>
                  <span className="text-danger">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {(() => {
                const hasExcludeVat = invoice.items.some((i: any) => i.vatType === 'EXCLUDE' && i.vatRate > 0) || 
                                      (invoice.vatRate > 0 && !invoice.items.some((i: any) => i.vatType === 'INCLUDE'));
                return hasExcludeVat && invoice.vatAmount > 0 && (
                  <div className="total-row-standard">
                    <span>VAT {invoice.vatRate > 0 ? `(${invoice.vatRate}%)` : ''}:</span>
                    <span>{formatCurrency(invoice.vatAmount)}</span>
                  </div>
                );
              })()}
              {invoice.taxAmount > 0 && (
                <div className="total-row-standard">
                  <span>TAX / AIT {invoice.taxRate > 0 ? `(${invoice.taxRate}%)` : ''}:</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="grand-total-standard">
                <span>Total Due:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
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

      <style dangerouslySetInnerHTML={{ __html: INVOICE_STYLES }} />
    </div>
  );
}
