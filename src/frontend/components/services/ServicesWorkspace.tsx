import React from "react";
import { Cloud, Server, ArrowLeft, Plus, Eye, Copy } from "lucide-react";
import { LocalServicesMenu, type LocalServiceRecord } from "./LocalServicesMenu";
import { ServiceEditor } from "./ServiceEditor";
import { apiClient } from "../../../libraries/client/apiClient";

type View = "chooser" | "local" | "cloud";
type CloudService = { id: string; name: string; description?: string; version?: string; packageName?: string };

export const ServicesWorkspace: React.FC<{
  services: LocalServiceRecord[];
  onSave: (s: LocalServiceRecord) => void;
  onCreate: () => void;
  onBack: () => void;
  onCopyLocal?: (service: CloudService) => Promise<void> | void;
  userId?: string | null;
}> = ({ services, onSave, onCreate, onBack, onCopyLocal, userId }) => {
  const [view, setView] = React.useState<View>("chooser");
  const [editor, setEditor] = React.useState<LocalServiceRecord | null>(null);
  const [cloudServices, setCloudServices] = React.useState<CloudService[]>([]);
  const [cloudLoading, setCloudLoading] = React.useState(false);

  React.useEffect(() => {
    if (view !== "cloud") return;
    setCloudLoading(true);
    apiClient.listKloksServices()
      .then((data) => setCloudServices(Array.isArray(data?.services) ? data.services : []))
      .catch(() => setCloudServices([]))
      .finally(() => setCloudLoading(false));
  }, [view]);

  if (editor) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
        <ServiceEditor
          service={editor}
          onBack={() => setEditor(null)}
          onSave={(next) => { onSave(next); setEditor(next); }}
        />
      </div>
    );
  }

  if (view === "local") {
    return (
      <div className="h-full flex flex-col bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
        <div className="h-12 px-4 flex items-center border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
          <button onClick={() => setView("chooser")} className="flex items-center gap-1 text-xs"><ArrowLeft size={13}/> Services</button>
          <span className="ml-4 font-black text-xs">Local Services</span>
        </div>
        <div className="flex-1"><LocalServicesMenu services={services} onOpen={setEditor} onCreate={onCreate}/></div>
      </div>
    );
  }

  if (view === "cloud") {
    return (
      <div className="h-full flex flex-col bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
        <div className="h-12 px-4 flex items-center border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
          <button onClick={() => setView("chooser")} className="flex items-center gap-1 text-xs"><ArrowLeft size={13}/> Services</button>
          <span className="ml-4 font-black text-xs">Cloud Services · KLOKS</span>
        </div>
        <section className="flex-1 p-5 overflow-auto">
          <div className="mb-4">
            <h2 className="text-lg font-black">Cloud Services</h2>
            <p className="text-[10px] text-[var(--skipo-text-muted)]">Canonical KLOKS services are view-only. Copy a service locally before editing.</p>
          </div>
          {cloudLoading ? (
            <div className="text-xs text-[var(--skipo-text-muted)]">Loading KLOKS services...</div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {cloudServices.map((service) => (
                <article key={service.id} className="p-4 rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
                  <Cloud size={18} className="mb-3 text-[var(--skipo-accent)]"/>
                  <div className="font-bold truncate">{service.name}</div>
                  <div className="text-[10px] text-[var(--skipo-text-muted)] mt-1 line-clamp-2">{service.description || "KLOKS service"}</div>
                  <div className="text-[9px] mt-3 text-[var(--skipo-text-muted)]">{service.version ? `v${service.version}` : "Canonical KLOKS asset"}</div>
                  <div className="mt-4 flex gap-2">
                    <button disabled className="flex items-center gap-1 px-2 py-1 rounded border text-[9px] opacity-60"><Eye size={11}/> View only</button>
                    <button disabled={Boolean(userId) === false} onClick={() => void (onCopyLocal ? onCopyLocal(service) : apiClient.copyKloksServiceLocally(service.id, userId || ""))} className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--skipo-accent)] text-black text-[9px] font-bold"><Copy size={11}/> Copy locally</button>
                  </div>
                </article>
              ))}
              {!cloudServices.length && <div className="col-span-full p-8 border border-dashed rounded text-xs text-[var(--skipo-text-muted)]">No KLOKS services are currently discoverable.</div>}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
      <div className="h-12 px-4 flex items-center border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
        <button onClick={onBack} className="text-xs">← Workspace</button>
        <span className="ml-4 font-black text-xs">Services</span>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Services</h1>
          <p className="text-xs text-[var(--skipo-text-muted)] mt-1">Choose a service source to author or inspect.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <button onClick={() => setView("local")} className="text-left min-h-52 p-6 rounded-xl border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]">
            <Server size={26} className="text-[var(--skipo-accent)] mb-5"/>
            <div className="font-black text-lg">Local Services</div>
            <div className="text-[10px] text-[var(--skipo-text-muted)] mt-1">Editable service folders belonging to this workspace.</div>
            <div className="mt-5 text-[9px]">{services.length} local service{services.length === 1 ? "" : "s"}</div>
          </button>
          <button onClick={() => setView("cloud")} className="text-left min-h-52 p-6 rounded-xl border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]">
            <Cloud size={26} className="text-[var(--skipo-accent)] mb-5"/>
            <div className="font-black text-lg">Cloud Services</div>
            <div className="text-[10px] text-[var(--skipo-text-muted)] mt-1">KLOKS services available as canonical, view-only assets.</div>
            <div className="mt-5 text-[9px]">KLOKS catalog</div>
          </button>
          <button onClick={onCreate} className="text-left min-h-40 p-6 rounded-xl border border-dashed border-[var(--skipo-border-color)]/50 hover:border-[var(--skipo-accent)] md:col-span-2">
            <Plus size={22} className="mb-4"/>
            <div className="font-black">Create Local Service</div>
            <div className="text-[10px] text-[var(--skipo-text-muted)] mt-1">Start a new editable service in this workspace.</div>
          </button>
        </div>
      </div>
    </div>
  );
};
