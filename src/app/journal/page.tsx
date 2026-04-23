import JournalForm from "@/components/JournalForm";
import JournalList from "@/components/JournalList";
import { setupChartOfAccounts, getAccounts, getJournalEntries, getContacts } from "@/actions/journal";

export default async function JournalPage() {
  await setupChartOfAccounts();
  
  const accounts = await getAccounts();
  const contacts = await getContacts();
  const entries = await getJournalEntries();

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1 className="text-3xl font-bold">General Journal</h1>
        <p className="text-secondary text-base">Record your double-entry accounting transactions.</p>
      </header>

      <div className="layout-grid">
        <div className="form-section">
          <JournalForm accounts={accounts} contacts={contacts} />
        </div>
        <div className="list-section">
          <JournalList entries={entries} />
        </div>
      </div>

      <style>{`
        .page-container { padding-bottom: 40px; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        .mb-8 { margin-bottom: 32px; }
        .layout-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
      `}</style>
    </div>
  );
}
