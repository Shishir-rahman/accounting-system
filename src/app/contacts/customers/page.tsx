import ContactDirectory from "@/components/ContactDirectory";

export const dynamic = 'force-dynamic';
export const revalidate = 5;

export default function CustomersPage() {
  return <ContactDirectory type="CUSTOMER" title="Customers" />;
}
