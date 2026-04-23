'use client'

import { useState, useEffect } from 'react';
import { getAccounts, createAccount } from '@/actions/journal';
import { useRouter } from 'next/navigation';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const data = await getAccounts();
    setAccounts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const res = await createAccount({ code, name, type, description });
    if (res.success) {
      setCode(''); setName(''); setDescription('');
      setShowForm(false);
      fetchAccounts();
      router.refresh();
    } else {
      setError(res.error || 'Failed to create account');
    }
    setIsSubmitting(false);
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, any[]>);

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8 flex justify-between align-center">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-secondary text-base">Manage your financial categories and ledgers.</p>
        </div>
        <div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ New Account'}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">Create New Account</h2>
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="grid-2-col">
            <div className="form-group">
              <label>Account Code (e.g. 6010)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Account Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-control" />
            </div>
            <div className="form-group">
              <label>Account Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="form-control">
                {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: 'fit-content' }}>
                {isSubmitting ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-secondary">Loading Chart of Accounts...</div>
      ) : (
        <div className="grid-2-col" style={{ alignItems: 'start' }}>
          {accountTypes.map(type => (
            <div key={type} className="card">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>{type}</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Code</th>
                      <th style={{ width: '80%' }}>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groupedAccounts[type] || []).length === 0 ? (
                      <tr><td colSpan={2} className="text-secondary">No accounts in this category.</td></tr>
                    ) : (
                      (groupedAccounts[type] || []).map((acc: any) => (
                        <tr key={acc.id}>
                          <td className="font-bold text-secondary">{acc.code}</td>
                          <td>
                            <div className="font-medium">{acc.name}</div>
                            {acc.description && <div className="text-sm text-secondary">{acc.description}</div>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-4 { margin-bottom: 16px; }
        .mb-8 { margin-bottom: 32px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .align-center { align-items: center; }
        .text-center { text-align: center; }
        .text-sm { font-size: 0.85rem; }
        
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }

        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .data-table th, .data-table td { padding: 12px; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background-color: var(--bg-secondary); color: var(--text-secondary); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
        
        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        @media (max-width: 1024px) { .grid-2-col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
