/**
 * @file MonacoCodeViewer.tsx
 * @description Reusable Monaco code and JSON syntax highlighter component.
 */

import React from 'react';
import Editor from '@monaco-editor/react';

interface MonacoCodeViewerProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  height?: string;
  onChange?: (value: string | undefined) => void;
}

export const MonacoCodeViewer: React.FC<MonacoCodeViewerProps> = ({
  value,
  language = 'typescript',
  readOnly = true,
  height = '100%',
  onChange,
}) => {
  return (
    <div className="w-full h-full overflow-hidden rounded border border-[var(--skipo-border-color)]/30 bg-[#1e1e1e]">
      <Editor
        height={height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          tabSize: 2,
        }}
      />
    </div>
  );
};
