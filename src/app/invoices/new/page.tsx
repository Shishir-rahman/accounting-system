import { getContactsByType } from "@/actions/contact";
import { getCompanySettings } from "@/actions/settings";
import InvoiceForm from "@/components/InvoiceForm";
import Link from "next/link";

export default async function NewInvoicePage() {
  const contacts = await getContactsByType('CUSTOMER');
  const settings = await getCompanySettings();

  return (
    <div className="page-container fade-in">
      <div className="mb-6">
        <Link href="/invoices" className="back-link">← Back to Invoices</Link>
      </div>
      <InvoiceForm contacts={contacts} settings={settings} />
      
      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-6 { margin-bottom: 24px; }
        .back-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
        .back-link:hover { color: var(--brand-primary); }
      `}</style>
    </div>
  );
}
