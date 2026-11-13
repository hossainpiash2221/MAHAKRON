
import { auth, isAdminEmail } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (
    !session?.user?.email ||
    !isAdminEmail(session.user.email)
  ) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  return children;
}
