import { getAccessContext } from "@/lib/guards";
import { isOrgOwner } from "@/lib/access";
import { cancelSubscription } from "@/lib/billing";

export async function POST() {
  const ctx = await getAccessContext();
  if (!ctx || !isOrgOwner(ctx.orgRole)) {
    return Response.json(
      { error: "Only the workspace owner can cancel." },
      { status: 403 }
    );
  }
  if (!ctx.activeOrganizationId) {
    return Response.json({ error: "No active workspace." }, { status: 400 });
  }
  await cancelSubscription(ctx.activeOrganizationId);
  return Response.json({ ok: true });
}
