import { getContacts } from "@/actions/journal";
import { getInvoiceById } from "@/actions/invoice";
import { getCompanySettings } from "@/actions/settings";
import InvoiceForm from "@/components/InvoiceForm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await getInvoiceById(resolvedParams.id);
  
  if (!invoice) {
    notFound();
  }

  // Security / Accounting rule: only DRAFT invoices can be edited
  if (invoice.status !== 'DRAFT') {
    redirect(`/invoices/${invoice.id}`);
  }

  const contacts = await getContacts();
  const settings = await getCompanySettings();

  return (
    <div className="page-container fade-in">
      <div className="mb-6">
        <Link href={`/invoices/${invoice.id}`} className="back-link">← Back to Invoice</Link>
      </div>
      <InvoiceForm contacts={contacts} settings={settings} initialData={invoice} />
      
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
