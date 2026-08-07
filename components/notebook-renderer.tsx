'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Terminal,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type OutputType = 'text' | 'error' | 'html' | 'image';

interface CellOutput {
  type: OutputType;
  content: string;
}

type CellType = 'code' | 'markdown' | 'text';

interface NotebookCell {
  id: string;
  type: CellType;
  source: string;
  outputs?: CellOutput[];
}

interface NotebookData {
  title?: string;
  runtime?: string;
  cells: NotebookCell[];
}

// ─── Output renderer ─────────────────────────────────────────────────────────

function OutputView({ output }: { output: CellOutput }) {
  if (output.type === 'error') {
    return (
      <div className="nb-output nb-output--error">
        <Terminal className="nb-output-error-icon" />
        <pre className="nb-output-error-pre">{output.content}</pre>
      </div>
    );
  }
  if (output.type === 'html') {
    return (
      <div
        className="nb-output nb-output--html"
        dangerouslySetInnerHTML={{ __html: output.content }}
      />
    );
  }
  if (output.type === 'image') {
    return (
      <div className="nb-output nb-output--image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={output.content} alt="output" className="nb-output-img" />
      </div>
    );
  }
  return (
    <div className="nb-output nb-output--text">
      <pre className="nb-output-text-pre">{output.content}</pre>
    </div>
  );
}

// ─── Single cell ─────────────────────────────────────────────────────────────

function Cell({
  cell,
  isRunning,
  hasRun,
  execCount,
  onRun,
}: {
  cell: NotebookCell;
  isRunning: boolean;
  hasRun: boolean;
  execCount: number | null;
  onRun: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isCode = cell.type === 'code';
  const label = execCount !== null ? `[${execCount}]` : isRunning ? '[*]' : '[ ]';

  return (
    <div className={[
      'nb-cell',
      `nb-cell--${cell.type}`,
      isRunning ? 'nb-cell--running' : '',
      hasRun ? 'nb-cell--done' : '',
    ].filter(Boolean).join(' ')}>

      {/* gutter */}
      <div className="nb-gutter">
        {isCode ? (
          <button
            className={`nb-run-btn${isRunning ? ' nb-run-btn--active' : ''}`}
            onClick={() => onRun(cell.id)}
            disabled={isRunning}
            title={isRunning ? 'Running…' : 'Run cell'}
            aria-label="Run cell"
          >
            {isRunning
              ? <Square className="nb-run-icon nb-run-icon--stop" />
              : <Play  className="nb-run-icon" />}
          </button>
        ) : (
          <span className="nb-gutter-type-icon">
            <FileText className="nb-type-icon" />
          </span>
        )}
        {isCode && (
          <span className="nb-exec-count">{label}</span>
        )}
      </div>

      {/* body */}
      <div className="nb-body">
        <div className={`nb-source nb-source--${cell.type}`}>
          {isCode && (
            <button
              className="nb-collapse-btn"
              onClick={() => setCollapsed(c => !c)}
              aria-label="Toggle collapse"
            >
              {collapsed
                ? <ChevronRight className="nb-collapse-icon" />
                : <ChevronDown  className="nb-collapse-icon" />}
            </button>
          )}
          {collapsed ? (
            <div className="nb-collapsed-hint">
              <Code2 className="nb-collapsed-icon" />
              <span>
                {cell.source.split('\n')[0]}
                {cell.source.includes('\n') ? ' …' : ''}
              </span>
            </div>
          ) : (
            <pre className="nb-code-pre">
              <code className="nb-code">{cell.source}</code>
            </pre>
          )}
        </div>

        {hasRun && !collapsed && cell.outputs && cell.outputs.length > 0 && (
          <div className="nb-outputs">
            {cell.outputs.map((o, i) => <OutputView key={i} output={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notebook container ───────────────────────────────────────────────────────

function NotebookContainer({ data }: { data: NotebookData }) {
  const { resolvedTheme } = useTheme();

  const [runState, setRunState] = useState<Record<string, 'idle' | 'running' | 'done'>>(() =>
    Object.fromEntries(data.cells.map(c => [c.id, 'idle' as const]))
  );
  const [execCounts, setExecCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(data.cells.map(c => [c.id, null]))
  );
  const globalCount = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const isAnyRunning = Object.values(runState).some(s => s === 'running');

  function runCell(cellId: string) {
    if (runState[cellId] === 'running') return;
    setRunState(s => ({ ...s, [cellId]: 'running' }));
    const t = setTimeout(() => {
      globalCount.current += 1;
      const n = globalCount.current;
      setRunState(s => ({ ...s, [cellId]: 'done' }));
      setExecCounts(s => ({ ...s, [cellId]: n }));
    }, 300 + Math.random() * 600);
    timers.current.push(t);
  }

  function runAll() {
    data.cells
      .filter(c => c.type === 'code')
      .forEach((c, i) => {
        const t = setTimeout(() => runCell(c.id), i * 700);
        timers.current.push(t);
      });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunState(Object.fromEntries(data.cells.map(c => [c.id, 'idle' as const])));
    setExecCounts(Object.fromEntries(data.cells.map(c => [c.id, null])));
    globalCount.current = 0;
  }

  return (
    <div className={`nb-root ${resolvedTheme === 'dark' ? 'nb-dark' : 'nb-light'}`}>
      {/* toolbar */}
      <div className="nb-toolbar">
        <div className="nb-toolbar-left">
          {data.title   && <span className="nb-title">{data.title}</span>}
          {data.runtime && <span className="nb-runtime-badge">{data.runtime}</span>}
        </div>
        <div className="nb-toolbar-right">
          <button
            className="nb-toolbar-btn nb-toolbar-btn--primary"
            onClick={runAll}
            disabled={isAnyRunning}
          >
            <Play className="nb-toolbar-icon" />
            Run all
          </button>
          <button className="nb-toolbar-btn" onClick={reset}>
            <Square className="nb-toolbar-icon" />
            Reset
          </button>
        </div>
      </div>

      {/* cells */}
      <div className="nb-cells">
        {data.cells.map(cell => (
          <Cell
            key={cell.id}
            cell={cell}
            isRunning={runState[cell.id] === 'running'}
            hasRun={runState[cell.id] === 'done'}
            execCount={execCounts[cell.id]}
            onRun={runCell}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Public export — used directly by page.tsx ────────────────────────────────

export function NotebookBlock({ data }: { data: any }) {
  // Normalise: ensure every cell has a stable id
  const normalised: NotebookData = {
    ...data,
    cells: (data.cells ?? []).map((c: any, i: number) => ({
      ...c,
      id: c.id ?? `cell-${i}`,
    })),
  };
  return <NotebookContainer data={normalised} />;
}
