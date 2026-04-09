import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  detectMermaidCapability,
  isSupportedMermaidDiagram,
} from '../../../gitnexus-web/src/lib/mermaid-capability.ts';

const AGENT_SOURCE = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'gitnexus-web',
  'src',
  'core',
  'llm',
  'agent.ts',
);

describe('gitnexus-web mermaid capability boundary', () => {
  it('accepts only the flowchart syntax variants used by GitNexus Web', () => {
    expect(detectMermaidCapability('graph TD\n  A --> B')).toEqual({
      diagramType: 'flowchart',
      supported: true,
    });

    expect(detectMermaidCapability('graph LR\n  A --> B')).toEqual({
      diagramType: 'flowchart',
      supported: true,
    });

    expect(detectMermaidCapability('flowchart TD\n  A --> B')).toEqual({
      diagramType: 'flowchart',
      supported: true,
    });

    expect(isSupportedMermaidDiagram('flowchart LR\n  A --> B')).toBe(true);
  });

  it('rejects Mermaid diagram families outside the supported flowchart boundary', () => {
    expect(detectMermaidCapability('sequenceDiagram\n  Alice->>Bob: hi')).toEqual({
      diagramType: 'sequence',
      supported: false,
    });

    expect(detectMermaidCapability('classDiagram\n  Animal <|-- Duck')).toEqual({
      diagramType: 'class',
      supported: false,
    });

    expect(detectMermaidCapability('stateDiagram-v2\n  [*] --> Ready')).toEqual({
      diagramType: 'state',
      supported: false,
    });
  });

  it('locks the chat agent prompt to flowchart-only Mermaid guidance', () => {
    const source = fs.readFileSync(AGENT_SOURCE, 'utf-8');

    expect(source).toContain('Only generate Mermaid flowcharts using graph TD or graph LR.');
    expect(source).toContain(
      'Do not emit sequenceDiagram, classDiagram, stateDiagram, erDiagram, gantt, journey, pie, architecture, mindmap, or other Mermaid diagram types.',
    );
  });
});
