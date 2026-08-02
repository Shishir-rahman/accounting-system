import ContactDirectory from "@/components/ContactDirectory";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CustomersPage() {
  return <ContactDirectory type="CUSTOMER" title="Customers" />;
}
