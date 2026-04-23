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
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 30px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
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
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
