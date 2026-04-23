import prisma from "@/lib/prisma";

export default async function IncomeStatementPage() {
  const accounts = await prisma.account.findMany({
    where: {
      type: { in: ['REVENUE', 'EXPENSE'] }
    },
    include: {
      lines: true
    }
  });

  const revenues: Record<string, number> = {};
  const expenses: Record<string, number> = {};
  
  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach(acc => {
    // For Revenue, Credit increases it, Debit decreases it
    // For Expense, Debit increases it, Credit decreases it
    let net = 0;
    
    if (acc.type === 'REVENUE') {
      net = acc.lines.reduce((sum, line) => sum + (line.credit - line.debit), 0);
      if (net > 0 || acc.lines.length > 0) {
        revenues[acc.name] = net;
        totalRevenue += net;
      }
    } else if (acc.type === 'EXPENSE') {
      net = acc.lines.reduce((sum, line) => sum + (line.debit - line.credit), 0);
      if (net > 0 || acc.lines.length > 0) {
        expenses[acc.name] = net;
        totalExpense += net;
      }
    }
  });

  const netIncome = totalRevenue - totalExpense;

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">Income Statement</h1>
        <p className="text-secondary text-base">Comprehensive view of revenues and expenses.</p>
      </header>

      <div className="report-card card">
        <h2 className="report-title">Revenue</h2>
        <div className="report-section">
          {Object.entries(revenues).map(([accName, amount]) => (
            <div key={accName} className="report-row">
              <span>{accName}</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
          {Object.keys(revenues).length === 0 && (
            <div className="report-row text-secondary">No revenue recorded</div>
          )}
          <div className="report-row total-row text-success">
            <strong>Total Revenue</strong>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </div>

        <h2 className="report-title mt-8">Expenses</h2>
        <div className="report-section">
          {Object.entries(expenses).map(([accName, amount]) => (
            <div key={accName} className="report-row">
              <span>{accName}</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
          {Object.keys(expenses).length === 0 && (
            <div className="report-row text-secondary">No expenses recorded</div>
          )}
          <div className="report-row total-row text-danger">
            <strong>Total Expenses</strong>
            <strong>{formatCurrency(totalExpense)}</strong>
          </div>
        </div>

        <div className={`net-income-box mt-8 ${netIncome >= 0 ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
          <h3 className="text-xl font-bold">Net Income</h3>
          <h2 className="text-3xl font-bold">{formatCurrency(netIncome)}</h2>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .mt-8 { margin-top: 32px; }
        
        .report-card {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }

        .report-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 8px;
        }

        .report-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
        }

        .total-row {
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
          margin-top: 8px;
          font-size: 1.05rem;
        }

        .net-income-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-radius: var(--radius-md);
        }

        .bg-success-light { background-color: var(--success-bg); }
        .bg-danger-light { background-color: var(--danger-bg); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
