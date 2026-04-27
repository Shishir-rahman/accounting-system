'use client'

import { useState } from 'react';
import { sendInvoice } from '@/actions/invoice';
import { useRouter } from 'next/navigation';

export default function InvoiceActions({ invoiceId, status }: { invoiceId: string, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await sendInvoice(invoiceId);

    if (res.success) {
      setSuccess('Invoice sent successfully! A Journal Entry has been created.');
      router.refresh();
    } else {
      setError(res.error || 'Failed to send invoice');
    }
    
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-actions no-print">
      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      <div className="flex gap-4">
        <button onClick={handlePrint} className="btn btn-secondary">
          🖨️ Print / Save PDF
        </button>

        {status === 'DRAFT' ? (
          <button onClick={handleSend} disabled={loading} className="btn btn-primary flex-1">
            {loading ? 'Sending...' : '✉️ Send via Email (Finalize)'}
          </button>
        ) : (
          <button disabled className="btn btn-primary disabled flex-1">
            ✅ Invoice Sent
          </button>
        )}
      </div>

      {status === 'DRAFT' && (
        <p className="help-text mt-2 text-center text-secondary text-sm">
          Sending this invoice will finalize it and automatically post it to the General Journal.
        </p>
      )}

      <style>{`
        .gap-4 { gap: 16px; }
        .flex { display: flex; }
        .flex-1 { flex: 1; }
        .mb-4 { margin-bottom: 16px; }
        .mt-2 { margin-top: 8px; }
        .text-center { text-align: center; }
        .text-sm { font-size: 0.85rem; }

        .btn { padding: 12px 24px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; font-size: 0.95rem; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.2s;}
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-secondary { background-color: white; color: var(--text-primary); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background-color: var(--bg-secondary); }
        .disabled { opacity: 0.7; cursor: not-allowed; background-color: var(--success); }

        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        .alert-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.2); }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
