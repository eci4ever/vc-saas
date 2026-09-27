import { redirect } from "next/navigation";

// Member management moved to its own sidebar section for owners and org
// admins; anyone landing here goes to the right place (guards bounce
// non-managers if they somehow follow an old link).
export default function MembersSettingsPage() {
  redirect("/dashboard/manage/members");
}
