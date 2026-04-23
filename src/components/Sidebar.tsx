import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">AC</div>
        <h1 className="logo-text">Finance<span style={{color: 'var(--brand-primary)'}}>Pro</span></h1>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-label">MENU</div>
        <ul>
          <li>
            <Link href="/" className="menu-item">
              <span className="menu-icon">📊</span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/invoices" className="menu-item">
              <span className="menu-icon">🧾</span>
              Billing & Invoices
            </Link>
          </li>
          <li>
            <Link href="/products" className="menu-item">
              <span className="menu-icon">📦</span>
              Products & Services
            </Link>
          </li>
          <div className="menu-label mt-6" style={{ marginTop: '24px' }}>DIRECTORY</div>
          <li>
            <Link href="/contacts/customers" className="menu-item">
              <span className="menu-icon">👥</span>
              Customers
            </Link>
          </li>
          <li>
            <Link href="/contacts/suppliers" className="menu-item">
              <span className="menu-icon">🏢</span>
              Suppliers
            </Link>
          </li>
          <div className="menu-label mt-6" style={{ marginTop: '24px' }}>REPORTS</div>
          <li>
            <Link href="/reports/sales" className="menu-item">
              <span className="menu-icon">📈</span>
              Sales Report
            </Link>
          </li>
          <li>
            <Link href="/journal" className="menu-item">
              <span className="menu-icon">📓</span>
              Journal Entries
            </Link>
          </li>
          <li>
            <Link href="/ledgers" className="menu-item">
              <span className="menu-icon">📒</span>
              General Ledger
            </Link>
          </li>
          <li>
            <Link href="/reports/income-statement" className="menu-item">
              <span className="menu-icon">📄</span>
              Income Statement
            </Link>
          </li>
          <li>
            <Link href="/reports/balance-sheet" className="menu-item">
              <span className="menu-icon">⚖️</span>
              Balance Sheet
            </Link>
          </li>
          <li>
            <Link href="/reports/cash-flow" className="menu-item">
              <span className="menu-icon">💰</span>
              Cash Flow
            </Link>
          </li>
          <div className="menu-label mt-6" style={{ marginTop: '24px' }}>CONFIGURATION</div>
          <li>
            <Link href="/accounts" className="menu-item">
              <span className="menu-icon">🏦</span>
              Chart of Accounts
            </Link>
          </li>
          <li>
            <Link href="/settings" className="menu-item">
              <span className="menu-icon">⚙️</span>
              Settings
            </Link>
          </li>
        </ul>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          padding: 24px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background-color: var(--brand-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .menu-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 16px;
          letter-spacing: 1px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .menu-icon {
          font-size: 1.25rem;
        }

        .menu-item:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .menu-item.active {
          background-color: var(--brand-primary);
          color: white;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </aside>
  );
}
