export const DEFAULT_WORKSPACE_NAME = "Default Workspace";

/** metadata: { isDefault: true } marks the workspace every signup receives. */
export function isDefaultMetadata(metadata: string | null | undefined) {
  if (!metadata) return false;
  try {
    return (JSON.parse(metadata) as { isDefault?: boolean }).isDefault === true;
  } catch {
    return false;
  }
}
