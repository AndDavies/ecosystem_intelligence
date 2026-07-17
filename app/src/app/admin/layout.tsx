import type { Metadata } from "next";
import { requireAdminOwner } from "@/lib/atlas/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminOwner();
  return children;
}
