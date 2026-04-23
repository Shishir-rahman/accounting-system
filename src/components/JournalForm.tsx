'use client'

import { useState } from 'react';
import { createJournalEntry } from '@/actions/journal';

export default function JournalForm({ accounts, contacts }: { accounts: any[], contacts: any[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  
  // Dynamic Lines State
  const [lines, setLines] = useState([
    { id: 1, accountId: '', debit: '', credit: '', description: '', contactId: '' },
    { id: 2, accountId: '', debit: '', credit: '', description: '', contactId: '' },
  ]);

  const addLine = () => {
    setLines([...lines, { id: Date.now(), accountId: '', debit: '', credit: '', description: '', contactId: '' }]);
  };

  const removeLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const updateLine = (id: number, field: string, value: string) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        // If entering Debit, clear Credit (and vice versa) to prevent both having values
        if (field === 'debit' && value !== '' && value !== '0') {
          return { ...line, debit: value, credit: '' };
        }
        if (field === 'credit' && value !== '' && value !== '0') {
          return { ...line, credit: value, debit: '' };
        }
        return { ...line, [field]: value };
      }
      return line;
    }));
  };

  const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    if (!isBalanced) {
      setError(`Journal is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
      setLoading(false);
      return;
    }

    if (totalDebits === 0) {
      setError('Entry must have a non-zero value.');
      setLoading(false);
      return;
    }

    const formattedLines = lines
      .filter(l => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
      .map(l => ({
        accountId: l.accountId,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description,
        contactId: l.contactId || undefined
      }));

    if (formattedLines.length < 2) {
      setError('At least two valid lines (one debit, one credit) are required.');
      setLoading(false);
      return;
    }

    const res = await createJournalEntry({ date, description, reference, lines: formattedLines });
    
    if (res.success) {
      setSuccess(true);
      setDescription('');
      setReference('');
      setLines([
        { id: Date.now(), accountId: '', debit: '', credit: '', description: '', contactId: '' },
        { id: Date.now() + 1, accountId: '', debit: '', credit: '', description: '', contactId: '' }
      ]);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || 'Something went wrong');
    }
    
    setLoading(false);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Record Journal Entry</h2>
      
      {success && <div className="alert alert-success">Journal Entry recorded successfully!</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="header-fields">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="form-control" />
          </div>
          <div className="form-group">
            <label>Reference #</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="form-control" placeholder="Optional" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Entry Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="form-control" placeholder="What is this journal entry for?" />
          </div>
        </div>

        <div className="table-responsive mt-6">
          <table className="journal-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '25%' }}>ACCOUNT</th>
                <th style={{ width: '15%' }}>DEBITS</th>
                <th style={{ width: '15%' }}>CREDITS</th>
                <th style={{ width: '20%' }}>DESCRIPTION</th>
                <th style={{ width: '15%' }}>NAME</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <select 
                      value={line.accountId} 
                      onChange={e => updateLine(line.id, 'accountId', e.target.value)}
                      className="table-input"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" step="0.01" min="0" placeholder="0.00"
                      value={line.debit} 
                      onChange={e => updateLine(line.id, 'debit', e.target.value)}
                      className="table-input text-right"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" step="0.01" min="0" placeholder="0.00"
                      value={line.credit} 
                      onChange={e => updateLine(line.id, 'credit', e.target.value)}
                      className="table-input text-right"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" placeholder="Line description"
                      value={line.description} 
                      onChange={e => updateLine(line.id, 'description', e.target.value)}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <select 
                      value={line.contactId} 
                      onChange={e => updateLine(line.id, 'contactId', e.target.value)}
                      className="table-input"
                    >
                      <option value="">None</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => removeLine(line.id)} className="btn-icon" disabled={lines.length <= 2}>
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={2} className="text-right"><strong>Totals:</strong></td>
                <td className={`text-right font-bold ${!isBalanced && totalDebits > 0 ? 'text-danger' : 'text-success'}`}>
                  {totalDebits.toFixed(2)}
                </td>
                <td className={`text-right font-bold ${!isBalanced && totalCredits > 0 ? 'text-danger' : 'text-success'}`}>
                  {totalCredits.toFixed(2)}
                </td>
                <td colSpan={3}>
                  {!isBalanced && (totalDebits > 0 || totalCredits > 0) && (
                    <span className="text-danger text-sm ml-2">Out of balance by {Math.abs(totalDebits - totalCredits).toFixed(2)}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="form-actions mt-4">
          <button type="button" onClick={addLine} className="btn btn-secondary">
            + Add Line
          </button>
          
          <button type="submit" disabled={loading || !isBalanced || totalDebits === 0} className="btn btn-primary">
            {loading ? 'Saving...' : 'Save Journal Entry'}
          </button>
        </div>
      </form>

      <style>{`
        .header-fields { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); }
        .form-control:focus { outline: none; border-color: var(--brand-primary); }
        
        .journal-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .journal-table th, .journal-table td { border: 1px solid var(--border-color); padding: 0; }
        .journal-table th { background-color: var(--bg-secondary); color: var(--text-secondary); padding: 12px 8px; font-weight: 600; font-size: 0.8rem; text-align: left; }
        .journal-table td.text-center { text-align: center; padding: 8px; }
        .journal-table td.text-right { text-align: right; }
        
        .table-input { width: 100%; height: 100%; padding: 12px 8px; border: none; background: transparent; font-size: 0.9rem; color: var(--text-primary); outline: none; }
        .table-input:focus { background-color: rgba(67, 24, 255, 0.05); }
        .table-input.text-right { text-align: right; }
        
        .totals-row td { padding: 12px 8px; background-color: var(--bg-secondary); border-top: 2px solid var(--border-color); }
        
        .btn-icon { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .btn-icon:hover:not(:disabled) { background-color: var(--danger-bg); color: var(--danger); }
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .form-actions { display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background-color: var(--border-color); }
        
        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; margin-bottom: 24px; }
        .alert-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.2); }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }
        
        .ml-2 { margin-left: 8px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
      `}</style>
    </div>
  );
}
