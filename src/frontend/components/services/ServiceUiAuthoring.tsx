import React from 'react';
import { UIAuthoringServiceFacade } from '@ultrst-armada/kloks/services';
import { listComponentContracts } from '@ultrst-armada/floks/contracts';
import { UiAuthoringWorkspace } from '@ultrst-armada/floks/canvas-ui';
import type { UIAuthoringSession } from '@ultrst-armada/kloks/contracts';
import type { FunctionalityAsset } from './functionalityEditorModel';

export function ServiceUiAuthoring(props: {
  serviceId: string;
  functionalities: FunctionalityAsset[];
  onClose: () => void;
  onSave: (schema: unknown) => void;
}) {
  const [session, setSession] = React.useState<UIAuthoringSession | null>(null);
  const [status, setStatus] = React.useState('Creating authoring session…');

  const assets = React.useMemo(() => listComponentContracts().map((contract) => ({
    packageId: '@ultrst-armada/floks',
    packageVersion: '^1.4.0',
    exportPath: 'ui',
    assetId: contract.componentId,
    assetVersion: contract.componentVersion,
  })), []);

  React.useEffect(() => {
    let mounted = true;
    const operations = props.functionalities.map((fn) => ({
      operationId: fn.id,
      name: fn.name,
      description: fn.description,
      inputFields: [{ name: 'input', type: fn.inputSignature }],
      outputFields: [{ name: 'output', type: fn.outputSignature }],
    }));
    void UIAuthoringServiceFacade.execute('createSession', {
      context: 'service',
      operations,
      metadata: { serviceId: props.serviceId },
    }).then((created) => {
      if (!mounted) return;
      setSession(created);
      setStatus('Authoring session ready');
    }).catch((error) => {
      if (mounted) setStatus(error instanceof Error ? error.message : 'Authoring session failed');
    });
    return () => { mounted = false; };
  }, [props.serviceId, props.functionalities]);

  const updateSession = (next: UIAuthoringSession) => {
    setSession(next);
    void UIAuthoringServiceFacade.execute('replaceSession', { sessionId: next.sessionId, session: next });
  };

  const validate = async () => {
    if (!session) return;
    const result = await UIAuthoringServiceFacade.execute('validate', { sessionId: session.sessionId });
    setStatus(result.valid ? 'Validation passed' : result.errors.join(' · '));
  };

  const save = async () => {
    if (!session) return;
    const schema = await UIAuthoringServiceFacade.execute('generateServiceUI', { sessionId: session.sessionId });
    props.onSave(schema);
    setStatus('Service UI schema saved');
  };

  if (!session) {
    return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 text-xs text-white">{status}</div>;
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] px-4">
        <div className="text-xs font-black">Service UI Authoring · {props.serviceId}</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--skipo-text-muted)]">{status}</span>
          <button onClick={validate} className="rounded border px-3 py-1.5 text-xs">Validate</button>
          <button onClick={save} className="rounded bg-[var(--skipo-accent)] px-3 py-1.5 text-xs font-bold text-black">Save UI Schema</button>
          <button onClick={props.onClose} className="rounded border px-3 py-1.5 text-xs">Close</button>
        </div>
      </header>
      <main className="min-h-0 flex-1 p-3">
        <UiAuthoringWorkspace session={session} availableAssets={assets} onChange={updateSession} onValidate={validate} />
      </main>
    </div>
  );
}
