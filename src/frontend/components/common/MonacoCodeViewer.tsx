/**
 * @file MonacoCodeViewer.tsx
 * @description Reusable Monaco code and JSON syntax highlighter backed by FLOKS/KLOKS IDE infrastructure.
 */

import React from 'react';
import { MonacoEditor } from '@ultrst-armada/floks/canvas-ui';
import type { MonacoEditorProps as SharedMonacoEditorProps } from '@ultrst-armada/floks/canvas-ui';
import { MonacoIdeServiceFacade } from '@ultrst-armada/kloks/services';

interface MonacoCodeViewerProps extends Pick<SharedMonacoEditorProps, 'diagnostics' | 'completionProvider' | 'onValidate' | 'onServiceError'> {
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
  diagnostics,
  completionProvider,
  onValidate,
  onServiceError,
}) => (
  <div className="w-full h-full overflow-hidden rounded border border-[var(--skipo-border-color)]/30 bg-[#1e1e1e]">
    <MonacoEditor
      ideService={MonacoIdeServiceFacade}
      value={value}
      language={language}
      theme="vs-dark"
      readOnly={readOnly}
      minimap={false}
      fontSize={12}
      height={height}
      width="100%"
      onChange={onChange}
      diagnostics={diagnostics}
      completionProvider={completionProvider}
      onValidate={onValidate}
      onServiceError={onServiceError}
    />
  </div>
);
