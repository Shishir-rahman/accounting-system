import { getContactProfile } from "@/actions/contact";
import { notFound } from "next/navigation";
import ClientEditContact from "./ClientEditContact";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const contact = await getContactProfile(resolvedParams.id);
  
  if (!contact) {
    notFound();
  }

  return <ClientEditContact contact={contact} />;
}
