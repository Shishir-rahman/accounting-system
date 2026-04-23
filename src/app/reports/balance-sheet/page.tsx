import prisma from "@/lib/prisma";

export default async function BalanceSheetPage() {
  const accounts = await prisma.account.findMany({
    where: {
      type: { in: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] }
    },
    include: {
      lines: true
    }
  });

  const assets: Record<string, number> = {};
  const liabilities: Record<string, number> = {};
  const equity: Record<string, number> = {};
  
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  
  // Calculate Net Income for Retained Earnings
  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach(acc => {
    let net = 0;
    
    if (acc.type === 'ASSET') {
      net = acc.lines.reduce((sum, line) => sum + (line.debit - line.credit), 0);
      assets[acc.name] = net;
      totalAssets += net;
    } else if (acc.type === 'LIABILITY') {
      net = acc.lines.reduce((sum, line) => sum + (line.credit - line.debit), 0);
      liabilities[acc.name] = net;
      totalLiabilities += net;
    } else if (acc.type === 'EQUITY') {
      net = acc.lines.reduce((sum, line) => sum + (line.credit - line.debit), 0);
      equity[acc.name] = net;
      totalEquity += net;
    } else if (acc.type === 'REVENUE') {
      net = acc.lines.reduce((sum, line) => sum + (line.credit - line.debit), 0);
      totalRevenue += net;
    } else if (acc.type === 'EXPENSE') {
      net = acc.lines.reduce((sum, line) => sum + (line.debit - line.credit), 0);
      totalExpense += net;
    }
  });

  const netIncome = totalRevenue - totalExpense;
  totalEquity += netIncome; // Add net income to equity

  const formatCurrency = (amount: number) => '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">Balance Sheet</h1>
        <p className="text-secondary text-base">Snapshot of financial position (Assets = Liabilities + Equity).</p>
      </header>

      <div className="grid-2-col">
        {/* Assets Side */}
        <div className="report-card card">
          <h2 className="report-title">Assets</h2>
          <div className="report-section">
            {Object.entries(assets).map(([accName, amount]) => (
              <div key={accName} className="report-row">
                <span>{accName}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(assets).length === 0 && (
              <div className="report-row text-secondary">No assets recorded</div>
            )}
          </div>
          <div className="report-row total-row mt-8 text-success font-bold text-lg">
            <span>Total Assets</span>
            <span>{formatCurrency(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities & Equity Side */}
        <div className="report-card card">
          <h2 className="report-title">Liabilities</h2>
          <div className="report-section mb-8">
            {Object.entries(liabilities).map(([accName, amount]) => (
              <div key={accName} className="report-row">
                <span>{accName}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(liabilities).length === 0 && (
              <div className="report-row text-secondary">No liabilities recorded</div>
            )}
            <div className="report-row total-row font-semibold">
              <span>Total Liabilities</span>
              <span>{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>

          <h2 className="report-title">Equity</h2>
          <div className="report-section">
            {Object.entries(equity).map(([accName, amount]) => (
              <div key={accName} className="report-row">
                <span>{accName}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="report-row">
              <span>Retained Earnings (Net Income)</span>
              <span>{formatCurrency(netIncome)}</span>
            </div>
            <div className="report-row total-row font-semibold">
              <span>Total Equity</span>
              <span>{formatCurrency(totalEquity)}</span>
            </div>
          </div>

          <div className="report-row total-row mt-8 text-brand font-bold text-lg" style={{ '--brand': 'var(--brand-primary)' } as any}>
            <span>Total Liabilities & Equity</span>
            <span style={{ color: 'var(--brand-primary)' }}>{formatCurrency(totalLiabilities + totalEquity)}</span>
          </div>
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .mt-8 { margin-top: 32px; }
        
        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .report-card {
          padding: 32px;
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
          border-top: 2px solid var(--border-color);
          padding-top: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .grid-2-col { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
