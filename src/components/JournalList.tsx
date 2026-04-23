import React from 'react';

export default function JournalList({ entries }: { entries: any[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Recent Journal Entries</h2>
        <div className="empty-state text-secondary">No entries found.</div>
        <style>{`.empty-state { padding: 40px; text-align: center; background: var(--bg-primary); border-radius: var(--radius-sm); border: 1px dashed var(--border-color); }`}</style>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Recent Journal Entries</h2>
      
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref</th>
              <th>Description / Account</th>
              <th>Name</th>
              <th className="text-right">Debit (Dr)</th>
              <th className="text-right">Credit (Cr)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <React.Fragment key={entry.id}>
                {/* Entry Header Row */}
                <tr className="entry-header">
                  <td><strong>{new Date(entry.date).toLocaleDateString()}</strong></td>
                  <td>{entry.reference || '-'}</td>
                  <td colSpan={4}><strong>{entry.description}</strong></td>
                </tr>
                
                {/* Entry Line Rows */}
                {entry.lines.map((line: any) => (
                  <tr key={line.id} className="entry-line">
                    <td></td>
                    <td></td>
                    <td style={{ paddingLeft: line.credit > 0 ? '40px' : '16px' }}>
                      {line.account.name} {line.description ? `(${line.description})` : ''}
                    </td>
                    <td>{line.contact ? <span className="badge badge-neutral">{line.contact.name}</span> : '-'}</td>
                    <td className="text-right text-success">{line.debit > 0 ? line.debit.toLocaleString() : ''}</td>
                    <td className="text-right text-danger">{line.credit > 0 ? line.credit.toLocaleString() : ''}</td>
                  </tr>
                ))}
                
                {/* Spacing Row */}
                <tr className="spacer-row"><td colSpan={6}></td></tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .data-table th, .data-table td { padding: 10px 16px; text-align: left; }
        .data-table th { background-color: var(--bg-primary); color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.8rem; border-bottom: 2px solid var(--border-color); }
        .entry-header { background-color: var(--bg-primary); }
        .entry-line td { border-bottom: 1px solid var(--border-color); }
        .entry-line:last-child td { border-bottom: none; }
        .spacer-row td { padding: 8px 0; border: none; }
        .text-right { text-align: right !important; }
      `}</style>
    </div>
  );
}
