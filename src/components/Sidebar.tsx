'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="mobile-nav-header">
        <button onClick={toggleSidebar} className="hamburger-btn" aria-label="Toggle Navigation Menu">
          {isOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-logo flex items-center gap-2">
          <div className="logo-icon-sm">AC</div>
          <span className="logo-text-sm">Finance<span style={{ color: 'var(--brand-primary)' }}>Pro</span></span>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      {/* Main Navigation Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">AC</div>
          <h1 className="logo-text">Finance<span style={{ color: 'var(--brand-primary)' }}>Pro</span></h1>
          <button onClick={closeSidebar} className="close-drawer-btn">✕</button>
        </div>

        <div className="sidebar-menu">
          <div className="menu-label">MENU</div>
          <ul>
            <li>
              <Link href="/" onClick={closeSidebar} className={`menu-item ${isActive('/') ? 'active' : ''}`}>
                <span className="menu-icon">📊</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/invoices" onClick={closeSidebar} className={`menu-item ${isActive('/invoices') ? 'active' : ''}`}>
                <span className="menu-icon">🧾</span>
                Billing & Invoices
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={closeSidebar} className={`menu-item ${isActive('/products') ? 'active' : ''}`}>
                <span className="menu-icon">📦</span>
                Products & Services
              </Link>
            </li>

            <div className="menu-label mt-6">DIRECTORY</div>
            <li>
              <Link href="/contacts/customers" onClick={closeSidebar} className={`menu-item ${isActive('/contacts/customers') ? 'active' : ''}`}>
                <span className="menu-icon">👥</span>
                Customers
              </Link>
            </li>
            <li>
              <Link href="/contacts/suppliers" onClick={closeSidebar} className={`menu-item ${isActive('/contacts/suppliers') ? 'active' : ''}`}>
                <span className="menu-icon">🏢</span>
                Suppliers
              </Link>
            </li>

            <div className="menu-label mt-6">REPORTS</div>
            <li>
              <Link href="/reports/sales" onClick={closeSidebar} className={`menu-item ${isActive('/reports/sales') ? 'active' : ''}`}>
                <span className="menu-icon">📈</span>
                Sales Report
              </Link>
            </li>
            <li>
              <Link href="/journal" onClick={closeSidebar} className={`menu-item ${isActive('/journal') ? 'active' : ''}`}>
                <span className="menu-icon">📓</span>
                Journal Entries
              </Link>
            </li>
            <li>
              <Link href="/ledgers" onClick={closeSidebar} className={`menu-item ${isActive('/ledgers') ? 'active' : ''}`}>
                <span className="menu-icon">📒</span>
                General Ledger
              </Link>
            </li>
            <li>
              <Link href="/reports/income-statement" onClick={closeSidebar} className={`menu-item ${isActive('/reports/income-statement') ? 'active' : ''}`}>
                <span className="menu-icon">📄</span>
                Income Statement
              </Link>
            </li>
            <li>
              <Link href="/reports/balance-sheet" onClick={closeSidebar} className={`menu-item ${isActive('/reports/balance-sheet') ? 'active' : ''}`}>
                <span className="menu-icon">⚖️</span>
                Balance Sheet
              </Link>
            </li>
            <li>
              <Link href="/reports/cash-flow" onClick={closeSidebar} className={`menu-item ${isActive('/reports/cash-flow') ? 'active' : ''}`}>
                <span className="menu-icon">💰</span>
                Cash Flow
              </Link>
            </li>

            <div className="menu-label mt-6">CONFIGURATION</div>
            <li>
              <Link href="/accounts" onClick={closeSidebar} className={`menu-item ${isActive('/accounts') ? 'active' : ''}`}>
                <span className="menu-icon">🏦</span>
                Chart of Accounts
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={closeSidebar} className={`menu-item ${isActive('/settings') ? 'active' : ''}`}>
                <span className="menu-icon">⚙️</span>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      <style>{`
        /* Mobile Top Bar */
        .mobile-nav-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 0 16px;
          align-items: center;
          justify-content: space-between;
          z-index: 90;
          box-shadow: var(--shadow-sm);
        }

        .hamburger-btn {
          font-size: 1.5rem;
          color: var(--text-primary);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
        }

        .logo-icon-sm {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: var(--brand-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .logo-text-sm {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .close-drawer-btn {
          display: none;
          font-size: 1.3rem;
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
        }

        /* Backdrop */
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          z-index: 95;
          animation: fadeIn 0.2s ease-in-out;
        }

        /* Sidebar Drawer */
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
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
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
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        .mt-6 {
          margin-top: 24px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 6px;
          min-height: 44px;
          transition: all 0.2s ease;
        }

        .menu-icon {
          font-size: 1.2rem;
        }

        .menu-item:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .menu-item.active {
          background-color: var(--brand-primary);
          color: white;
          font-weight: 600;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .mobile-nav-header {
            display: flex;
          }

          .close-drawer-btn {
            display: flex;
          }

          .sidebar {
            transform: translateX(-100%);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
          }

          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
