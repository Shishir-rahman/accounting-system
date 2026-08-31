export default function DashboardCards({ data }: { data: any }) {
  const formatCurrency = (amount: number) => {
    return '৳ ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  return (
    <>
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon bank-icon">🏦</div>
          <div className="stat-content">
            <h3 className="stat-title">Bank Balance</h3>
            <div className="stat-value">{formatCurrency(data.totalBank)}</div>
            <div className="stat-change text-secondary">Actual Balance</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon cash-icon">💵</div>
          <div className="stat-content">
            <h3 className="stat-title">Cash Balance</h3>
            <div className="stat-value">{formatCurrency(data.totalCash)}</div>
            <div className="stat-change text-secondary">Actual Balance</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon total-icon">📈</div>
          <div className="stat-content">
            <h3 className="stat-title">Total Balance</h3>
            <div className="stat-value">{formatCurrency(data.totalBalance)}</div>
            <div className="stat-change text-secondary">Combined Cash & Bank</div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .bank-icon {
          background-color: var(--brand-secondary);
          color: var(--brand-primary);
        }

        .cash-icon {
          background-color: var(--success-bg);
          color: var(--success);
        }

        .total-icon {
          background-color: var(--warning-bg);
          color: var(--warning);
        }

        .stat-title {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
          word-break: break-word;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .stat-card {
            padding: 16px;
          }
          .stat-value {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </>
  );
}
