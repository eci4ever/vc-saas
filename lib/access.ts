import {
  Building2Icon,
  CreditCardIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  PackageIcon,
  RepeatIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react";

/** Platform-wide roles from better-auth's admin plugin. */
export type PlatformRole = "admin" | "user";

/** Roles inside an organization from better-auth's organization plugin. */
export type OrgRole = "owner" | "admin" | "member";

export const ORG_ROLES: readonly OrgRole[] = ["owner", "admin", "member"];

export function isPlatformAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

/** member.role can hold multiple roles comma-separated (e.g. "owner,admin"). */
export function parseOrgRoles(role: string | null | undefined): OrgRole[] {
  if (!role) return [];
  return role
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is OrgRole => ORG_ROLES.includes(part as OrgRole));
}

export function hasOrgRole(
  role: string | null | undefined,
  ...wanted: OrgRole[]
): boolean {
  const roles = parseOrgRoles(role);
  return wanted.some((w) => roles.includes(w));
}

/** Owners and org admins manage the workspace (matches better-auth defaults). */
export function isOrgManager(role: string | null | undefined): boolean {
  return hasOrgRole(role, "owner", "admin");
}

export function isOrgOwner(role: string | null | undefined): boolean {
  return hasOrgRole(role, "owner");
}

/** Everything the sidebar needs to decide what a user can see. */
export type NavVisibility = {
  isPlatformAdmin: boolean;
  /** Role in the currently active organization; null when none is active. */
  orgRole: string | null;
};

export type NavGroup = "workspace" | "manage" | "administration";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
  visible: (nav: NavVisibility) => boolean;
};

/**
 * Single source of truth for dashboard navigation. The sidebar renders this
 * matrix and the route guards enforce the same predicates server-side, so
 * hiding an entry and blocking its URL can never drift apart.
 *
 * Workspace is the personal tier (everyone): Dashboard. Manage is org
 * management in a deliberate order: Overview, Billing, Settings — Members,
 * Invitations, and Teams live behind the Overview page's quick links instead
 * of the sidebar. Administration is platform-wide.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    group: "workspace",
    visible: () => true,
  },
  {
    title: "Overview",
    href: "/dashboard/manage",
    icon: GaugeIcon,
    group: "manage",
    visible: (nav) => isOrgManager(nav.orgRole),
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
    group: "manage",
    visible: (nav) => isOrgManager(nav.orgRole),
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    // Settings is workspace-only now that profile lives on the Account page.
    group: "manage",
    visible: (nav) => isOrgManager(nav.orgRole),
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: ShieldIcon,
    group: "administration",
    visible: (nav) => nav.isPlatformAdmin,
  },
  {
    title: "Organizations",
    href: "/dashboard/admin/organizations",
    icon: Building2Icon,
    group: "administration",
    visible: (nav) => nav.isPlatformAdmin,
  },
  {
    title: "Plans",
    href: "/dashboard/admin/plans",
    icon: PackageIcon,
    group: "administration",
    visible: (nav) => nav.isPlatformAdmin,
  },
  {
    title: "Subscriptions",
    href: "/dashboard/admin/subscriptions",
    icon: RepeatIcon,
    group: "administration",
    visible: (nav) => nav.isPlatformAdmin,
  },
  {
    title: "Audit Log",
    href: "/dashboard/admin/audit-log",
    icon: ScrollTextIcon,
    group: "administration",
    visible: (nav) => nav.isPlatformAdmin,
  },
];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  workspace: "Workspace",
  manage: "Manage",
  administration: "Administration",
};
