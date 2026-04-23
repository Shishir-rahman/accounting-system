import { getAccounts, getLedgerLines } from "@/actions/journal";
import Link from "next/link";

export default async function LedgersPage({
  searchParams,
}: {
  searchParams: { accountId?: string };
}) {
  const accountId = searchParams.accountId || '';
  const accounts = await getAccounts();
  const selectedAccount = accounts.find(a => a.id === accountId);
  const ledgerLines = await getLedgerLines(accountId);

  let runningBalance = 0;
  const isAssetOrExpense = selectedAccount?.type === 'ASSET' || selectedAccount?.type === 'EXPENSE';

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">General Ledger</h1>
        <p className="text-secondary text-base">View the history and running balance of a specific account.</p>
      </header>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Select Account</h2>
        <div className="account-selector">
          {accounts.map(acc => (
            <Link 
              key={acc.id} 
              href={`/ledgers?accountId=${acc.id}`}
              className={`account-pill ${accountId === acc.id ? 'active' : ''}`}
            >
              {acc.name} <span className="acc-code">({acc.code})</span>
            </Link>
          ))}
        </div>
      </div>

      {selectedAccount ? (
        <div className="card">
          <div className="ledger-header mb-6">
            <h2 className="text-xl font-bold">{selectedAccount.name} Ledger</h2>
            <div className="ledger-meta">
              <span className="badge badge-neutral">{selectedAccount.type}</span>
              <span className="badge badge-neutral">Code: {selectedAccount.code}</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ref</th>
                  <th>Description</th>
                  <th>Name</th>
                  <th className="text-right">Debit (Dr)</th>
                  <th className="text-right">Credit (Cr)</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerLines.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-8">No records found for this account.</td>
                  </tr>
                )}
                {ledgerLines.map(line => {
                  // Calculate running balance based on account type
                  if (isAssetOrExpense) {
                    runningBalance += (line.debit - line.credit);
                  } else {
                    // Liability, Equity, Revenue
                    runningBalance += (line.credit - line.debit);
                  }

                  return (
                    <tr key={line.id}>
                      <td>{new Date(line.journalEntry.date).toLocaleDateString()}</td>
                      <td>{line.journalEntry.reference || '-'}</td>
                      <td>{line.journalEntry.description} {line.description ? `- ${line.description}` : ''}</td>
                      <td>{line.contact ? <span className="badge badge-neutral">{line.contact.name}</span> : '-'}</td>
                      <td className="text-right text-success">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                      <td className="text-right text-danger">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                      <td className="text-right font-bold">{formatCurrency(runningBalance)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center text-secondary py-8">
            Please select an account from above to view its ledger.
          </div>
        </div>
      )}

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }

        .account-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .account-pill {
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .account-pill:hover {
          background-color: var(--border-color);
        }

        .account-pill.active {
          background-color: var(--brand-primary);
          color: white;
          border-color: var(--brand-primary);
        }

        .acc-code {
          opacity: 0.7;
          font-size: 0.75rem;
          margin-left: 4px;
        }

        .ledger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ledger-meta {
          display: flex;
          gap: 10px;
        }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.8rem; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }

        .badge { display: inline-block; padding: 4px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
        .badge-neutral { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
      `}</style>
    </div>
  );
}
