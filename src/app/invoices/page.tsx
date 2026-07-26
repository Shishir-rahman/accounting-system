import Link from "next/link";
import { getInvoices } from "@/actions/invoice";
import InvoiceTableClient from "./InvoiceTableClient";

export const dynamic = 'force-dynamic';
export const revalidate = 5;

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8 flex justify-between align-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-secondary text-base">Manage your customer invoices.</p>
        </div>
        <div>
          <Link href="/invoices/new" className="btn btn-primary">+ Create Invoice</Link>
        </div>
      </header>

      <div className="card">
        <InvoiceTableClient initialInvoices={invoices} />
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .align-center { align-items: center; }
        
        .btn { padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; }
        .btn-primary { background-color: var(--brand-primary); color: white; }
        .btn-primary:hover { background-color: var(--brand-primary-hover); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
