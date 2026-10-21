import React from "react";
import { HardDrive, Cloud, Plus, Trash2, LogOut, FolderOpen, X } from "lucide-react";
import type { WorkspaceRecord } from "@ultrst-armada/floks/ui";

type StorageMode = "local" | "backblaze";

export interface WorkspacesMenuProps {
  workspaces: WorkspaceRecord[];
  onSelectWorkspace: (workspace: WorkspaceRecord) => void;
  onCreateWorkspace: (input: {
    name: string;
    workspacePath?: string;
    storageProvider?: StorageMode;
    storageConfig?: Record<string, unknown>;
  }) => Promise<void> | void;
  onDeleteWorkspace?: (id: string) => Promise<void> | void;
  onLogout?: () => void;
  userId?: string | null;
}

export const WorkspacesMenu: React.FC<WorkspacesMenuProps> = ({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onLogout,
}) => {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [storageMode, setStorageMode] = React.useState<StorageMode>("local");
  const [workspacePath, setWorkspacePath] = React.useState("/workspaces");
  const [bucketName, setBucketName] = React.useState("");
  const [bucketEndpoint, setBucketEndpoint] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Workspace name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreateWorkspace({
        name: trimmedName,
        workspacePath: storageMode === "local" ? workspacePath.trim() || "/workspaces" : undefined,
        storageProvider: storageMode,
        storageConfig:
          storageMode === "backblaze"
            ? { bucketName: bucketName.trim(), endpoint: bucketEndpoint.trim() }
            : { rootPath: workspacePath.trim() || "/workspaces" },
      });
      setCreating(false);
      setName("");
      setBucketName("");
      setBucketEndpoint("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-auto bg-[var(--skipo-bg)] text-[var(--skipo-text)] font-mono">
      <header className="h-14 px-6 flex items-center justify-between border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
        <div>
          <div className="font-black tracking-widest text-sm">KULT ENGINE</div>
          <div className="text-[9px] text-[var(--skipo-text-muted)] uppercase tracking-wider">Workspaces</div>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[var(--skipo-border-color)]/30 text-xs hover:border-[var(--skipo-accent)]">
            <LogOut size={13} /> Sign out
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Your Workspaces</h1>
            <p className="mt-1 text-xs text-[var(--skipo-text-muted)]">Choose a workspace. Opening one is an explicit user action.</p>
          </div>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">
            <Plus size={15} /> New Workspace
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workspaces.map((workspace) => {
            const provider = String((workspace as any).storageProvider || "local");
            const isCloud = provider === "backblaze" || provider === "cloud";
            return (
              <div
                key={workspace.id}
                className="group min-h-44 rounded-xl border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)] transition-colors p-5 flex flex-col"
              >
                <button onDoubleClick={() => onSelectWorkspace(workspace)} onClick={() => onSelectWorkspace(workspace)} className="text-left flex-1">
                  <div className="w-11 h-11 rounded-lg bg-[var(--skipo-bg)] flex items-center justify-center mb-5">
                    {isCloud ? <Cloud size={22} className="text-[var(--skipo-accent)]" /> : <HardDrive size={22} className="text-[var(--skipo-accent)]" />}
                  </div>
                  <div className="font-black truncate">{workspace.name}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-wider text-[var(--skipo-text-muted)]">
                    {isCloud ? "Backblaze workspace" : "Local workspace"}
                  </div>
                  <div className="mt-3 text-[10px] text-[var(--skipo-text-muted)] truncate">
                    {(workspace as any).workspacePath || "workspace"}
                  </div>
                </button>
                {onDeleteWorkspace && (
                  <button
                    onClick={() => void onDeleteWorkspace(workspace.id)}
                    className="self-end mt-3 p-1.5 rounded opacity-0 group-hover:opacity-100 text-[var(--skipo-danger)] hover:bg-[var(--skipo-danger)]/10"
                    title="Delete workspace"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setCreating(true)}
            className="min-h-44 rounded-xl border border-dashed border-[var(--skipo-border-color)]/50 hover:border-[var(--skipo-accent)] flex flex-col items-center justify-center text-xs text-[var(--skipo-text-muted)]"
          >
            <Plus size={22} className="mb-3" />
            <span className="font-bold">Create workspace</span>
          </button>
        </div>

        {!workspaces.length && (
          <div className="mt-8 p-8 rounded-xl border border-dashed border-[var(--skipo-border-color)]/40 text-center text-xs text-[var(--skipo-text-muted)]">
            No workspaces yet. Create one to begin authoring services.
          </div>
        )}
      </main>

      {creating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black">Create Workspace</h2>
                <p className="text-[10px] text-[var(--skipo-text-muted)] mt-1">Choose where Kult will author local service folders.</p>
              </div>
              <button type="button" onClick={() => setCreating(false)}><X size={16} /></button>
            </div>

            <label className="block text-[10px] font-bold uppercase mb-1">Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border bg-[var(--skipo-bg)] px-3 py-2 text-xs mb-4" placeholder="My workspace" />

            <label className="block text-[10px] font-bold uppercase mb-2">Storage</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button type="button" onClick={() => setStorageMode("local")} className={`p-3 rounded border text-left ${storageMode === "local" ? "border-[var(--skipo-accent)]" : "border-[var(--skipo-border-color)]/30"}`}>
                <HardDrive size={16} className="mb-2" />
                <div className="text-xs font-bold">Local</div>
                <div className="text-[9px] text-[var(--skipo-text-muted)]">Workspace folders on the local filesystem.</div>
              </button>
              <button type="button" onClick={() => setStorageMode("backblaze")} className={`p-3 rounded border text-left ${storageMode === "backblaze" ? "border-[var(--skipo-accent)]" : "border-[var(--skipo-border-color)]/30"}`}>
                <Cloud size={16} className="mb-2" />
                <div className="text-xs font-bold">Backblaze</div>
                <div className="text-[9px] text-[var(--skipo-text-muted)]">Store the workspace against a Backblaze bucket.</div>
              </button>
            </div>

            {storageMode === "local" ? (
              <>
                <label className="block text-[10px] font-bold uppercase mb-1">Workspace root</label>
                <div className="relative">
                  <FolderOpen size={13} className="absolute left-3 top-2.5 text-[var(--skipo-text-muted)]" />
                  <input value={workspacePath} onChange={(e) => setWorkspacePath(e.target.value)} className="w-full rounded border bg-[var(--skipo-bg)] pl-8 pr-3 py-2 text-xs" />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Bucket</label>
                  <input value={bucketName} onChange={(e) => setBucketName(e.target.value)} className="w-full rounded border bg-[var(--skipo-bg)] px-3 py-2 text-xs" placeholder="Select/fill Backblaze bucket" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Endpoint (optional)</label>
                  <input value={bucketEndpoint} onChange={(e) => setBucketEndpoint(e.target.value)} className="w-full rounded border bg-[var(--skipo-bg)] px-3 py-2 text-xs" placeholder="Backblaze S3 endpoint" />
                </div>
              </div>
            )}

            {error && <div className="mt-4 rounded border border-[var(--skipo-danger)]/30 bg-[var(--skipo-danger)]/10 p-3 text-[10px] text-[var(--skipo-danger)]">{error}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 rounded border text-xs">Cancel</button>
              <button disabled={saving} className="px-4 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">{saving ? "Creating..." : "Create Workspace"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
