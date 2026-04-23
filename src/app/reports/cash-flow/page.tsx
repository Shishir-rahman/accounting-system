import prisma from "@/lib/prisma";

export default async function CashFlowPage() {
  const accounts = await prisma.account.findMany();
  
  // Find all Journal Entries that have a line affecting a BANK or CASH account
  const entries = await prisma.journalEntry.findMany({
    where: {
      lines: {
        some: {
          account: {
            type: 'ASSET',
            name: { in: ['Bank', 'Cash'] }
          }
        }
      }
    },
    include: {
      lines: {
        include: { account: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  const bankAccount = accounts.find(a => a.name === 'Bank');
  const cashAccount = accounts.find(a => a.name === 'Cash');

  let bankBalance = 0;
  let cashBalance = 0;
  let totalInflow = 0;
  let totalOutflow = 0;

  const cashFlowRows = entries.map(entry => {
    let inflow = 0;
    let outflow = 0;
    let affectedAccount = '';

    // Analyze lines for this entry
    entry.lines.forEach(line => {
      if (line.account.name === 'Bank') {
        affectedAccount = 'Bank';
        inflow += line.debit;
        outflow += line.credit;
        bankBalance += (line.debit - line.credit);
        totalInflow += line.debit;
        totalOutflow += line.credit;
      } else if (line.account.name === 'Cash') {
        affectedAccount = 'Cash';
        inflow += line.debit;
        outflow += line.credit;
        cashBalance += (line.debit - line.credit);
        totalInflow += line.debit;
        totalOutflow += line.credit;
      }
    });

    return {
      ...entry,
      affectedAccount,
      inflow,
      outflow,
      runningBank: bankBalance,
      runningCash: cashBalance
    };
  }).reverse();

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">Cash Flow & Petty Cash</h1>
        <p className="text-secondary text-base">Track the movement of cash and bank balances over time.</p>
      </header>

      <div className="grid-2-col mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-secondary mb-2">Total Inflow</h3>
          <div className="text-2xl font-bold text-success">{formatCurrency(totalInflow)}</div>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-secondary mb-2">Total Outflow</h3>
          <div className="text-2xl font-bold text-danger">{formatCurrency(totalOutflow)}</div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-6">Current Balances</h2>
        <div className="balance-row">
          <div className="balance-item">
            <span>Bank (Acct: {bankAccount?.code})</span>
            <span className="font-bold">{formatCurrency(bankBalance)}</span>
          </div>
          <div className="balance-item">
            <span>Petty Cash (Acct: {cashAccount?.code})</span>
            <span className="font-bold">{formatCurrency(cashBalance)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-6">Cash Flow Statement</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Account</th>
                <th className="text-right">Inflow</th>
                <th className="text-right">Outflow</th>
                <th className="text-right">Bank Bal.</th>
                <th className="text-right">Cash Bal.</th>
              </tr>
            </thead>
            <tbody>
              {cashFlowRows.map(row => (
                <tr key={row.id}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>{row.description}</td>
                  <td><span className="badge badge-neutral">{row.affectedAccount}</span></td>
                  <td className="text-right text-success">{row.inflow > 0 ? formatCurrency(row.inflow) : '-'}</td>
                  <td className="text-right text-danger">{row.outflow > 0 ? formatCurrency(row.outflow) : '-'}</td>
                  <td className="text-right font-medium">{formatCurrency(row.runningBank)}</td>
                  <td className="text-right font-medium">{formatCurrency(row.runningCash)}</td>
                </tr>
              ))}
              {cashFlowRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-secondary py-8">No cash flow records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-2 { margin-bottom: 8px; }
        .py-8 { padding-top: 32px !important; padding-bottom: 32px !important; }

        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .balance-row { display: flex; flex-direction: column; gap: 16px; }
        .balance-item { display: flex; justify-content: space-between; padding: 16px; background-color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 1.1rem; }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;}
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .data-table tbody tr:hover { background-color: var(--bg-primary); }
        
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }

        .badge { display: inline-block; padding: 4px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
        .badge-neutral { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
