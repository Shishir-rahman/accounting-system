import DashboardCards from "@/components/DashboardCards";
import { getSummaryData, getJournalEntries } from "@/actions/journal";
import Link from "next/link";

export default async function Home() {
  const summaryData = await getSummaryData();
  const entries = await getJournalEntries();
  const recentEntries = entries.slice(0, 5); // Just 5 recent

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-secondary text-sm">Welcome back! Here's your financial summary.</p>
        </div>
        
        <div className="header-actions">
          <Link href="/journal" className="btn btn-primary">+ New Journal Entry</Link>
        </div>
      </header>

      <DashboardCards data={summaryData} />

      <div className="grid-2-col">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Journal Entries</h2>
          {recentEntries.length === 0 ? (
            <div className="transaction-empty">
              <p className="text-secondary">No entries yet. Start by adding one!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="mini-table">
                <tbody>
                  {recentEntries.map(entry => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                    return (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>{entry.description}</td>
                        <td className="text-right font-medium">৳{totalDebit.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '16px' }}>
                <Link href="/journal" style={{ color: 'var(--brand-primary)', fontSize: '0.875rem', fontWeight: 600 }}>View All Entries →</Link>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Financial Insights</h2>
          <div className="insight-item">
            <span className="insight-label">Total Income</span>
            <span className="insight-value text-success">৳{summaryData.totalIncome.toLocaleString()}</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Total Expenses</span>
            <span className="insight-value text-danger">৳{summaryData.totalExpense.toLocaleString()}</span>
          </div>
          <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
          <div className="insight-item">
            <span className="insight-label font-bold">Net Income</span>
            <span className={`insight-value font-bold ${summaryData.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>
              ৳{summaryData.netIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          animation: fadeIn 0.4s ease-in-out;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .btn-primary {
          background-color: var(--brand-primary);
          color: white;
          box-shadow: 0 4px 10px rgba(67, 24, 255, 0.3);
        }

        .btn-primary:hover {
          background-color: var(--brand-primary-hover);
          transform: translateY(-1px);
        }

        .grid-2-col {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .mb-4 {
          margin-bottom: 16px;
        }

        .transaction-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background-color: var(--bg-primary);
          border-radius: var(--radius-sm);
          border: 1px dashed var(--border-color);
        }

        .mini-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        
        .mini-table td {
          padding: 12px 0;
          border-bottom: 1px solid var(--bg-primary);
        }
        
        .mini-table tr:last-child td {
          border-bottom: none;
        }

        .insight-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .grid-2-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
