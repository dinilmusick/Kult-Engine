import React from 'react';
import type { FunctionalityAsset } from './functionalityEditorModel';

export const FunctionalityEditor: React.FC<{
  functionality: FunctionalityAsset;
  onClose: () => void;
  onSave: (f: FunctionalityAsset) => void;
}> = ({ functionality, onClose, onSave }) => {
  const [name, setName] = React.useState(functionality.name);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-[420px] rounded border bg-[var(--skipo-surface)] p-4">
        <h2 className="font-black text-sm mb-4">Edit Functionality</h2>
        <label className="block text-[10px] mb-4">
          Name
          <input className="w-full rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-bg)] px-2 py-1.5 text-xs" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <button onClick={() => onSave({ ...functionality, name })} className="w-full py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">Save</button>
        <button onClick={onClose} className="w-full mt-2 py-2 rounded border border-[var(--skipo-border-color)] text-[var(--skipo-text)] text-xs">Close</button>
      </div>
    </div>
  );
};
