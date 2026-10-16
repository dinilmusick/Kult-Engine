/**
 * @file TestCaseView.tsx
 * @description Service Test Case Management, Assertion Runner & Round-Trip Verifier (§9, §13 & §29).
 */

import React, { useState } from 'react';
import { Check, X, Plus, Play, Beaker, ShieldCheck, RefreshCw } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { runRoundTripTest, type RoundTripReport } from '../../../libraries/services/roundTripTester';
import type { ServiceTestCase } from '../../../libraries/types/serviceIR';

export const TestCaseView: React.FC = () => {
  const { document, activeTestCaseId, setActiveTestCase, runSingleTest, saveTestCase } = useServiceDocumentStore();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [roundTripReport, setRoundTripReport] = useState<RoundTripReport | null>(null);
  const [isVerifyingRoundTrip, setIsVerifyingRoundTrip] = useState(false);

  const activeTest = document.tests.find((t) => t.id === activeTestCaseId) || document.tests[0];

  const handleRunTest = async (testId: string) => {
    const passed = await runSingleTest(testId);
    setTestResults((prev) => ({ ...prev, [testId]: passed }));
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    const results: Record<string, boolean> = {};
    for (const test of document.tests) {
      results[test.id] = await runSingleTest(test.id);
    }
    setTestResults(results);
    setIsRunningAll(false);
  };

  const handleRunRoundTrip = async () => {
    setIsVerifyingRoundTrip(true);
    const report = await runRoundTripTest(document);
    setRoundTripReport(report);
    setIsVerifyingRoundTrip(false);
  };

  const handleAddTest = () => {
    const newTest: ServiceTestCase = {
      id: `t-${Date.now().toString(36)}`,
      name: `Regression Case ${document.tests.length + 1}`,
      input: { a: 20, b: 5, operation: 'add' },
      assertions: [{ port: document.service.outputPorts[0]?.name || 'result', operator: 'defined', value: true }],
      enabled: true,
    };
    saveTestCase(newTest);
    setActiveTestCase(newTest.id);
  };

  return (
    <div className="h-full flex font-mono text-xs select-none">
      {/* Test List Column */}
      <div className="w-64 border-r border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)] flex flex-col">
        <div className="p-2 border-b border-[var(--skipo-border-color)]/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[var(--skipo-text)]">
            <Beaker size={13} className="text-[var(--skipo-accent)]" />
            <span>Test Cases</span>
          </div>
          <button onClick={handleAddTest} className="p-1 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 hover:bg-[var(--skipo-accent)] hover:text-black">
            <Plus size={11} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {document.tests.map((test) => {
            const result = testResults[test.id];
            const active = activeTest?.id === test.id;
            return (
              <div
                key={test.id}
                onClick={() => setActiveTestCase(test.id)}
                className={`p-2 rounded cursor-pointer border flex items-center justify-between ${
                  active ? 'border-[var(--skipo-accent)] bg-[var(--skipo-surface-hover)]' : 'border-transparent hover:bg-[var(--skipo-surface)] text-[var(--skipo-text-muted)]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {result === true && <Check size={12} className="text-[var(--skipo-success)] shrink-0" />}
                  {result === false && <X size={12} className="text-[var(--skipo-danger)] shrink-0" />}
                  {result === undefined && <span className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />}
                  <span className="truncate text-[var(--skipo-text)]">{test.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleRunTest(test.id); }} className="p-1 hover:text-[var(--skipo-accent)]">
                  <Play size={10} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-[var(--skipo-border-color)]/20 space-y-1.5">
          <button onClick={handleRunAll} disabled={isRunningAll} className="w-full py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} />
            <span>{isRunningAll ? 'Evaluating...' : 'Run All Tests'}</span>
          </button>
          <button onClick={handleRunRoundTrip} disabled={isVerifyingRoundTrip} className="w-full py-1.5 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 text-[var(--skipo-text)] hover:border-[var(--skipo-accent)] flex items-center justify-center gap-1.5">
            <RefreshCw size={11} className={isVerifyingRoundTrip ? 'animate-spin' : ''} />
            <span>Round-Trip Parity</span>
          </button>
        </div>
      </div>

      {/* Test Detail Column */}
      <div className="flex-1 p-3 overflow-y-auto bg-[var(--skipo-surface)] space-y-3">
        {roundTripReport && (
          <div className="p-2.5 rounded border border-[var(--skipo-accent)]/40 bg-[var(--skipo-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--skipo-text)] flex items-center gap-1.5">
                <RefreshCw size={12} className="text-[var(--skipo-accent)]" />
                <span>Round-Trip Parity Verification Report</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${roundTripReport.success ? 'bg-[var(--skipo-success)]/20 text-[var(--skipo-success)]' : 'bg-[var(--skipo-danger)]/20 text-[var(--skipo-danger)]'}`}>
                {roundTripReport.success ? 'PARITY VERIFIED' : 'DRIFT DETECTED'}
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              {roundTripReport.stages.map((st, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 border-b border-[var(--skipo-border-color)]/10">
                  <span className="flex items-center gap-1.5">
                    {st.passed ? <Check size={11} className="text-[var(--skipo-success)]" /> : <X size={11} className="text-[var(--skipo-danger)]" />}
                    <span>{st.stage}</span>
                  </span>
                  <span className="text-[10px] text-[var(--skipo-text-muted)]">{st.message} ({st.durationMs}ms)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTest && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--skipo-border-color)]/20">
              <div>
                <span className="text-sm font-bold text-[var(--skipo-text)]">{activeTest.name}</span>
                <span className="text-[10px] text-[var(--skipo-text-muted)] block font-mono">{activeTest.id}</span>
              </div>
              <button onClick={() => handleRunTest(activeTest.id)} className="px-3 py-1 rounded bg-[var(--skipo-accent)] text-black font-bold flex items-center gap-1">
                <Play size={11} />
                <span>Run Test</span>
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--skipo-text)] block mb-1">Test Input Payload (JSON)</span>
              <pre className="p-2 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20 text-[11px] text-[var(--skipo-text)]">
                {JSON.stringify(activeTest.input, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--skipo-text)] block mb-1">Assertions ({activeTest.assertions.length})</span>
              <div className="space-y-1">
                {activeTest.assertions.map((ass, i) => (
                  <div key={i} className="p-2 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20 flex items-center justify-between text-[11px]">
                    <span>{ass.port} <span className="text-[var(--skipo-accent)] font-bold">{ass.operator}</span> {String(ass.value)}</span>
                    <span className="text-[9px] text-[var(--skipo-success)] font-bold">ASSERTION ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
