import { getContactProfile } from "@/actions/contact";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ContactStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const contact = await getContactProfile(resolvedParams.id);

  if (!contact) {
    notFound();
  }

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Calculate Financial Summary
  const totalInvoiced = contact.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  // Outstanding Balance: 
  // For Customers: AR Debits - AR Credits
  // For Suppliers: AP Credits - AP Debits
  let totalDebit = 0;
  let totalCredit = 0;
  
  contact.lines.forEach(line => {
    totalDebit += line.debit;
    totalCredit += line.credit;
  });

  const isCustomer = contact.type === 'CUSTOMER';
  const outstandingBalance = isCustomer ? (totalDebit - totalCredit) : (totalCredit - totalDebit);

  return (
    <div className="page-container fade-in">
      <div className="mb-6">
        <Link href={`/contacts/${isCustomer ? 'customers' : 'suppliers'}`} className="back-link">
          ← Back to {isCustomer ? 'Customers' : 'Suppliers'}
        </Link>
      </div>

      <div className="profile-header card mb-8" style={{ flexDirection: 'column', gap: '24px', alignItems: 'stretch' }}>
        <header className="flex justify-between align-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{contact.name}</h1>
            <p className="text-secondary text-base">
              {contact.type === 'CUSTOMER' ? 'Customer' : 'Supplier'} Statement & History
            </p>
          </div>
          <div>
            <Link href={`/contacts/${contact.id}/edit`} className="btn btn-secondary">
              ✏️ Edit Profile
            </Link>
          </div>
        </header>
        
        <div className="profile-info">
          <div className="contact-details text-secondary">
            {contact.email && <span>✉️ {contact.email}</span>}
            {contact.phone && <span>📞 {contact.phone}</span>}
            {contact.address && <span>📍 {contact.address}</span>}
          </div>
        </div>
        <div className="profile-summary">
          <div className="summary-box">
            <span className="summary-label">Total Invoiced</span>
            <span className="summary-value text-brand">{formatCurrency(totalInvoiced)}</span>
          </div>
          <div className="summary-box">
            <span className="summary-label">Outstanding Balance</span>
            <span className={`summary-value ${outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
              {formatCurrency(outstandingBalance)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2-col">
        {/* Invoices List */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Invoices</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {contact.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-secondary">No invoices found.</td>
                  </tr>
                ) : (
                  contact.invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{new Date(inv.date).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/invoices/${inv.id}`} className="invoice-link">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${
                          inv.status === 'DRAFT' ? 'badge-neutral' :
                          inv.status === 'SENT' ? 'badge-info' : 'badge-success'
                        }`}>
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

        {/* Ledger / Transactions List */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Financial Transactions (Ledger)</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th className="text-right">Debit (Dr)</th>
                  <th className="text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {contact.lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-secondary">No transactions found.</td>
                  </tr>
                ) : (
                  contact.lines.map(line => (
                    <tr key={line.id}>
                      <td>{new Date(line.journalEntry.date).toLocaleDateString()}</td>
                      <td>
                        <strong>{line.account.name}</strong>
                        <div className="text-sm text-secondary">{line.journalEntry.description}</div>
                      </td>
                      <td className="text-right text-success">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                      <td className="text-right text-danger">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 60px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .py-4 { padding-top: 16px; padding-bottom: 16px; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .text-sm { font-size: 0.85rem; }
        .text-brand { color: var(--brand-primary); }
        
        .back-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .back-link:hover { color: var(--brand-primary); }

        .profile-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 32px; }
        .contact-details { display: flex; gap: 24px; font-size: 0.95rem; margin-top: 12px; }
        .contact-details span { display: flex; align-items: center; gap: 8px; }
        
        .profile-summary { display: flex; gap: 24px; }
        .summary-box { background-color: var(--bg-secondary); padding: 16px 24px; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: flex-end; min-width: 200px;}
        .summary-label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
        .summary-value { font-size: 1.5rem; font-weight: 800; }

        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background-color: var(--bg-secondary); color: var(--text-secondary); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }

        .badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;}
        .badge-neutral { background-color: #f1f5f9; color: #475569; }
        .badge-info { background-color: #e0f2fe; color: #0284c7; }
        .badge-success { background-color: var(--success-bg); color: var(--success); }

        .invoice-link { color: var(--brand-primary); font-weight: 600; text-decoration: none; }
        .invoice-link:hover { text-decoration: underline; }

        @media (max-width: 1024px) {
          .profile-header { flex-direction: column; gap: 24px; }
          .profile-summary { width: 100%; }
          .summary-box { flex: 1; align-items: flex-start; }
          .grid-2-col { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
