import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import { ProcessFlowModal } from './ProcessFlowModal';
import type { ProcessData } from '../lib/mermaid-generator';
import { detectMermaidCapability } from '../lib/mermaid-capability';
import { getInlineMermaid } from '../lib/mermaid-loader';

interface MermaidDiagramProps {
  code: string;
}

export const MermaidDiagram = ({ code }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      const capability = detectMermaidCapability(code);

      if (!capability.supported) {
        if (capability.diagramType === 'unknown') {
          setError(null);
        } else {
          setError(
            `GitNexus Web currently supports Mermaid flowcharts only. Detected ${capability.diagramType} syntax.`,
          );
        }
        return;
      }

      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const mermaid = await getInlineMermaid();
        const { svg } = await mermaid.render(id, code.trim());
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        // Silent catch for streaming: 
        // If render fails (common during partial streaming), we:
        // 1. Log to console for debugging
        // 2. Do NOT set error state (avoids flashing red box)
        // 3. Do NOT clear existing SVG (keeps last valid state visible)
        console.debug('Mermaid render skipped (incomplete):', err);
      }
    };

    // Debounce rendering to prevent "jerking" during high-speed streaming
    const timeoutId = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [code]);

  // Create a pseudo ProcessData for the modal (with custom rawMermaid property)
  const processData: any = showModal ? {
    id: 'ai-generated',
    label: 'AI Generated Diagram',
    processType: 'intra_community',
    steps: [], // Empty - we'll render raw mermaid
    edges: [],
    clusters: [],
    rawMermaid: code, // Pass raw mermaid code
  } : null;

  if (error) {
    return (
      <div className="my-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-rose-300 text-sm mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Diagram Error</span>
        </div>
        <pre className="text-xs text-rose-200/70 font-mono whitespace-pre-wrap">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
            Show source
          </summary>
          <pre className="mt-2 p-2 bg-surface rounded text-xs text-text-muted overflow-x-auto">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      <div className="my-3 relative group">
        <div className="relative bg-gradient-to-b from-surface to-elevated border border-border-subtle rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface/60 border-b border-border-subtle">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
              Diagram
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-hover rounded transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Diagram container */}
          <div
            ref={containerRef}
            className="flex items-center justify-center p-4 overflow-auto max-h-[400px]"
          />
        </div>
      </div>

      {/* Use ProcessFlowModal for expansion */}
      {showModal && processData && (
        <ProcessFlowModal
          process={processData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
