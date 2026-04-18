import type { IsoDateTimeString } from "./common.js";

export type WorkspaceRole = "owner" | "member" | "viewer";

/** GET /workspace (default) or item in GET /workspaces */
export type WorkspaceDto = {
  id: string;
  name: string;
  slug?: string;
  role: WorkspaceRole;
  createdAt: IsoDateTimeString;
};

/** GET /workspaces */
export type ListWorkspacesResponse = {
  workspaces: WorkspaceDto[];
  defaultWorkspaceId: string;
};
