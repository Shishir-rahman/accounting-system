import Link from "next/link";
import { getInvoices } from "@/actions/invoice";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8 flex justify-between align-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-secondary text-base">Manage your customer invoices.</p>
        </div>
        <div>
          <Link href="/invoices/new" className="btn btn-primary">+ Create Invoice</Link>
        </div>
      </header>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-secondary">No invoices found. Create one to get started.</td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="font-bold">{invoice.invoiceNumber}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{invoice.contact.name}</td>
                    <td className="text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="text-center">
                      <span className={`badge ${
                        invoice.status === 'DRAFT' ? 'badge-neutral' :
                        invoice.status === 'SENT' ? 'badge-info' : 'badge-success'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={`/invoices/${invoice.id}`} className="text-brand font-semibold text-sm mr-4" style={{ color: 'var(--brand-primary)' }}>View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .align-center { align-items: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .mr-4 { margin-right: 16px; }
        
        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover { background-color: var(--brand-primary-hover); }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .data-table th, .data-table td { padding: 16px; border-bottom: 1px solid var(--border-color); }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); text-align: left; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }

        .badge { display: inline-block; padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;}
        .badge-neutral { background-color: #f1f5f9; color: #475569; }
        .badge-info { background-color: #e0f2fe; color: #0284c7; }
        .badge-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.2); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
