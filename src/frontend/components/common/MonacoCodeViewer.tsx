/**
 * @file MonacoCodeViewer.tsx
 * @description Reusable Monaco code and JSON syntax highlighter backed by FLOKS/KLOKS IDE infrastructure.
 */

import React from 'react';
import { MonacoEditor } from '@ultrst-armada/floks/canvas-ui';

interface MonacoCodeViewerProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  height?: string;
  onChange?: (value: string) => void;
}

export const MonacoCodeViewer: React.FC<MonacoCodeViewerProps> = ({
  value,
  language = 'typescript',
  readOnly = true,
  height = '100%',
  onChange,
}) => (
  <div className="w-full h-full overflow-hidden rounded border border-[var(--skipo-border-color)]/30 bg-[#1e1e1e]">
    <MonacoEditor
      value={value}
      language={language}
      theme="vs-dark"
      readOnly={readOnly}
      minimap={false}
      fontSize={12}
      height={height}
      width="100%"
      onChange={onChange}
    />
  </div>
);
