import { redirect } from "next/navigation";

// Profile management lives on the Account page (user menu → Account).
export default function ProfileSettingsPage() {
  redirect("/dashboard/account");
}
