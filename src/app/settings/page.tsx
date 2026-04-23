'use client'

import { useState, useEffect } from 'react';
import { getCompanySettings, updateCompanySettings } from '@/actions/settings';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('BDT');

  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function loadSettings() {
      const settings = await getCompanySettings();
      setCompanyName(settings.companyName);
      setEmail(settings.email || '');
      setPhone(settings.phone || '');
      setAddress(settings.address || '');
      setTaxId(settings.taxId || '');
      setCurrency(settings.currency);
      setInvoicePrefix(settings.invoicePrefix || 'INV-');
      setDefaultNotes(settings.defaultNotes || '');
      setLogoUrl(settings.logoUrl || '');
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        setError('Image is too large. Please select an image under 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await updateCompanySettings({
      companyName,
      email,
      phone,
      address,
      taxId,
      currency,
      invoicePrefix,
      defaultNotes,
      logoUrl
    });

    if (res.success) {
      setSuccess('Company settings updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'Failed to update settings.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="page-container text-center py-8 text-secondary">Loading settings...</div>;
  }

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-secondary text-base">Manage your company profile and invoicing preferences.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="layout-grid">
          <div className="settings-section">
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-6">Company Information</h2>
              <p className="text-sm text-secondary mb-6">
                This information will be displayed on your invoices and reports.
              </p>

              {success && <div className="alert alert-success mb-6">{success}</div>}
              {error && <div className="alert alert-danger mb-6">{error}</div>}

              <div className="mb-6 flex gap-6 items-center">
                <div className="logo-preview-container">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo Preview" className="logo-preview" />
                  ) : (
                    <div className="logo-placeholder">No Logo</div>
                  )}
                </div>
                <div className="form-group flex-1">
                  <label>Company Logo (Max 500KB)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="form-control" 
                    style={{ padding: '8px' }} 
                  />
                  {logoUrl && (
                    <button type="button" onClick={() => setLogoUrl('')} className="btn-link mt-2" style={{ alignSelf: 'flex-start', color: 'var(--danger)' }}>
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid-2-col mb-4">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="form-control" />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="form-control" />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Billing / Physical Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="form-control" />
                </div>
                
                <div className="form-group">
                  <label>Tax ID / BIN (Optional)</label>
                  <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} className="form-control" />
                </div>
                
                <div className="form-group">
                  <label>Base Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="form-control">
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-6">Invoice Settings</h2>
              
              <div className="grid-2-col mb-4">
                <div className="form-group">
                  <label>Invoice Prefix</label>
                  <input type="text" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className="form-control" placeholder="e.g. INV-" />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Default Notes / Terms</label>
                  <textarea value={defaultNotes} onChange={e => setDefaultNotes(e.target.value)} rows={3} className="form-control" placeholder="Thank you for your business!" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .page-container { padding-bottom: 40px; max-width: 800px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mt-8 { margin-top: 32px; }
        .py-8 { padding-top: 32px; padding-bottom: 32px; }
        .text-center { text-align: center; }
        .text-sm { font-size: 0.85rem; }
        
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .form-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; background-color: var(--bg-secondary); font-family: inherit;}
        .form-control:focus { outline: none; border-color: var(--brand-primary); }

        .btn { padding: 12px 24px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; font-size: 1rem; transition: all 0.2s;}
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .alert { padding: 12px; border-radius: var(--radius-sm); font-weight: 500; font-size: 0.9rem; }
        .alert-success { background-color: var(--success-bg); color: var(--success); border: 1px solid rgba(5, 205, 153, 0.2); }
        .alert-danger { background-color: var(--danger-bg); color: var(--danger); border: 1px solid rgba(238, 93, 80, 0.2); }

        .logo-preview-container { width: 120px; height: 120px; border-radius: var(--radius-sm); border: 2px dashed var(--border-color); overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: var(--bg-secondary); }
        .logo-preview { max-width: 100%; max-height: 100%; object-fit: contain; }
        .logo-placeholder { color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .btn-link { background: none; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: color 0.2s; }
        .btn-link:hover { text-decoration: underline; }
        .mt-2 { margin-top: 8px; }

        @media (max-width: 768px) { .grid-2-col { grid-template-columns: 1fr; } .flex { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}
