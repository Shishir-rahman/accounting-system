import ContactDirectory from "@/components/ContactDirectory";

export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  return <ContactDirectory type="CUSTOMER" title="Customers" />;
}
