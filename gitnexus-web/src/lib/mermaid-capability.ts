export type MermaidDiagramType =
  | 'architecture'
  | 'block'
  | 'c4'
  | 'class'
  | 'er'
  | 'flowchart'
  | 'gantt'
  | 'gitGraph'
  | 'journey'
  | 'mindmap'
  | 'packet'
  | 'pie'
  | 'quadrant'
  | 'radar'
  | 'requirement'
  | 'sankey'
  | 'sequence'
  | 'state'
  | 'timeline'
  | 'treemap'
  | 'xychart'
  | 'unknown';

export interface MermaidCapabilityResult {
  diagramType: MermaidDiagramType;
  supported: boolean;
}

const FLOWCHART_PREFIX = /^(graph|flowchart)\b/i;

const DIAGRAM_TYPE_PATTERNS: Array<{
  diagramType: Exclude<MermaidDiagramType, 'flowchart' | 'unknown'>;
  pattern: RegExp;
}> = [
  { diagramType: 'sequence', pattern: /^sequenceDiagram\b/i },
  { diagramType: 'class', pattern: /^classDiagram(?:-v2)?\b/i },
  { diagramType: 'state', pattern: /^stateDiagram(?:-v2)?\b/i },
  { diagramType: 'er', pattern: /^erDiagram\b/i },
  { diagramType: 'journey', pattern: /^journey\b/i },
  { diagramType: 'gantt', pattern: /^gantt\b/i },
  { diagramType: 'pie', pattern: /^pie\b/i },
  { diagramType: 'mindmap', pattern: /^mindmap\b/i },
  { diagramType: 'timeline', pattern: /^timeline\b/i },
  { diagramType: 'gitGraph', pattern: /^gitGraph\b/i },
  { diagramType: 'architecture', pattern: /^architecture\b/i },
  { diagramType: 'quadrant', pattern: /^quadrantChart\b/i },
  { diagramType: 'xychart', pattern: /^xychart(?:-beta)?\b/i },
  { diagramType: 'sankey', pattern: /^sankey(?:-beta)?\b/i },
  { diagramType: 'block', pattern: /^block(?:-beta)?\b/i },
  { diagramType: 'packet', pattern: /^packet(?:-beta)?\b/i },
  { diagramType: 'radar', pattern: /^radar-beta\b/i },
  { diagramType: 'treemap', pattern: /^treemap\b/i },
  { diagramType: 'requirement', pattern: /^requirement(?:Diagram)?\b/i },
  { diagramType: 'c4', pattern: /^C4(?:Context|Container|Component|Dynamic|Deployment)\b/i },
];

const getFirstMeaningfulLine = (code: string): string => {
  const normalized = code.replace(/\r\n/g, '\n');

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%') || line === '---') {
      continue;
    }
    return line;
  }

  return '';
};

export const detectMermaidCapability = (code: string): MermaidCapabilityResult => {
  const firstLine = getFirstMeaningfulLine(code);

  if (!firstLine) {
    return {
      diagramType: 'unknown',
      supported: false,
    };
  }

  if (FLOWCHART_PREFIX.test(firstLine)) {
    return {
      diagramType: 'flowchart',
      supported: true,
    };
  }

  for (const entry of DIAGRAM_TYPE_PATTERNS) {
    if (entry.pattern.test(firstLine)) {
      return {
        diagramType: entry.diagramType,
        supported: false,
      };
    }
  }

  return {
    diagramType: 'unknown',
    supported: false,
  };
};

export const isSupportedMermaidDiagram = (code: string): boolean => {
  return detectMermaidCapability(code).supported;
};
