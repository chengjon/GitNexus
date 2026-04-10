import React from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

interface NodeAttrs {
  x: number;
  y: number;
}

interface EdgeAttrs {
  color: string;
  size?: number;
  relationType?: string;
}

interface SigmaSettings {
  edgeReducer?: (edge: string, data: EdgeAttrs) => EdgeAttrs & Record<string, unknown>;
}

type MockGraph = {
  nodes: Map<string, NodeAttrs>;
  edges: Map<string, [string, string]>;
  order: number;
  addNode: (nodeId: string, attrs: NodeAttrs) => void;
  addEdge: (edgeId: string, source: string, target: string) => void;
  hasNode: (nodeId: string) => boolean;
  getNodeAttributes: (nodeId: string) => NodeAttrs;
  hasEdge: (source: string, target: string) => boolean;
  extremities: (edgeId: string) => [string, string];
};

const createMockGraph = (): MockGraph => {
  const nodes = new Map<string, NodeAttrs>();
  const edges = new Map<string, [string, string]>();
  const graph: MockGraph = {
    nodes,
    edges,
    order: 0,
    addNode: (nodeId, attrs) => {
      nodes.set(nodeId, attrs);
      graph.order = nodes.size;
    },
    addEdge: (edgeId, source, target) => {
      edges.set(edgeId, [source, target]);
    },
    hasNode: (nodeId) => nodes.has(nodeId),
    getNodeAttributes: (nodeId) => {
      const attrs = nodes.get(nodeId);
      if (!attrs) throw new Error(`Missing mock node: ${nodeId}`);
      return attrs;
    },
    hasEdge: (source, target) => {
      for (const [edgeSource, edgeTarget] of edges.values()) {
        if (edgeSource === source && edgeTarget === target) return true;
      }
      return false;
    },
    extremities: (edgeId) => {
      const edge = edges.get(edgeId);
      if (!edge) throw new Error(`Missing mock edge: ${edgeId}`);
      return edge;
    },
  };
  return graph;
};

type SigmaMock = {
  camera: {
    ratio: number;
    animate: ReturnType<typeof vi.fn>;
    animatedReset: ReturnType<typeof vi.fn>;
    animatedZoom: ReturnType<typeof vi.fn>;
    animatedUnzoom: ReturnType<typeof vi.fn>;
  };
  refresh: ReturnType<typeof vi.fn>;
  setGraph: ReturnType<typeof vi.fn>;
  getGraph: ReturnType<typeof vi.fn>;
  getCamera: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  settings: SigmaSettings;
  graph: MockGraph;
};

let latestSigma: SigmaMock | null = null;
const noverlapAssign = vi.fn();
const inferSettings = vi.fn(() => ({}));
const fa2Start = vi.fn();
const fa2Stop = vi.fn();
const fa2Kill = vi.fn();
let graphologyGraphFactory = () => createMockGraph();
let graphAdapterGraphFactory = () => createMockGraph();

vi.mock('graphology', () => ({
  default: class GraphologyMock {
    constructor() {
      return graphologyGraphFactory();
    }
  },
}));

vi.mock('sigma', () => ({
  default: class SigmaMockClass {
    camera;
    refresh;
    setGraph;
    getGraph;
    getCamera;
    on;
    kill;
    settings;
    graph;

    constructor(graph: MockGraph, _container: HTMLDivElement, settings: SigmaSettings) {
      this.graph = graph;
      this.settings = settings;
      this.camera = {
        ratio: 1,
        animate: vi.fn((next: { ratio?: number }) => {
          if (typeof next.ratio === 'number') this.camera.ratio = next.ratio;
        }),
        animatedReset: vi.fn(),
        animatedZoom: vi.fn(),
        animatedUnzoom: vi.fn(),
      };
      this.refresh = vi.fn();
      this.setGraph = vi.fn((nextGraph: MockGraph) => {
        this.graph = nextGraph;
      });
      this.getGraph = vi.fn(() => this.graph);
      this.getCamera = vi.fn(() => this.camera);
      this.on = vi.fn();
      this.kill = vi.fn();
      latestSigma = this as unknown as SigmaMock;
    }
  },
}));

vi.mock('graphology-layout-forceatlas2/worker', () => ({
  default: class FA2LayoutMock {
    start = fa2Start;
    stop = fa2Stop;
    kill = fa2Kill;
  },
}));

vi.mock('graphology-layout-forceatlas2', () => ({
  default: { inferSettings },
}));

vi.mock('graphology-layout-noverlap', () => ({
  default: { assign: noverlapAssign },
}));

vi.mock('@sigma/edge-curve', () => ({
  default: class EdgeCurveProgramMock {},
}));

vi.mock('lucide-react', () => ({
  ZoomIn: () => null,
  ZoomOut: () => null,
  Maximize2: () => null,
  Focus: () => null,
  RotateCcw: () => null,
  Play: () => null,
  Pause: () => null,
  Lightbulb: () => null,
  LightbulbOff: () => null,
}));

vi.mock('../../src/components/QueryFAB', () => ({
  QueryFAB: () => null,
}));

const filterGraphByDepth = vi.fn();

vi.mock('../../src/lib/graph-adapter', () => ({
  knowledgeGraphToGraphology: vi.fn(() => graphAdapterGraphFactory()),
  filterGraphByDepth,
}));

const setSelectedNode = vi.fn();
const openCodePanel = vi.fn();

const baseGraph = {
  nodes: [
    { id: 'node-1', label: 'Function', properties: { name: 'Alpha' } },
    { id: 'node-2', label: 'Function', properties: { name: 'Beta' } },
    { id: 'node-3', label: 'Function', properties: { name: 'Gamma' } },
  ],
  relationships: [],
};

let currentAppState: any;

vi.mock('../../src/hooks/useAppState', () => ({
  useAppState: () => currentAppState,
}));

describe('GraphCanvas selection sync', () => {
  let root: Root | null = null;
  let host: HTMLDivElement | null = null;

  beforeEach(() => {
    latestSigma = null;
    noverlapAssign.mockClear();
    inferSettings.mockClear();
    fa2Start.mockClear();
    fa2Stop.mockClear();
    fa2Kill.mockClear();
    filterGraphByDepth.mockClear();
    setSelectedNode.mockClear();
    openCodePanel.mockClear();

    graphologyGraphFactory = () => createMockGraph();
    graphAdapterGraphFactory = () => {
      const graph = createMockGraph();
      graph.addNode('node-1', { x: 10, y: 20 });
      graph.addNode('node-2', { x: 30, y: 40 });
      graph.addNode('node-3', { x: 50, y: 60 });
      graph.addEdge('edge-1', 'node-1', 'node-2');
      graph.addEdge('edge-2', 'node-2', 'node-3');
      return graph;
    };

    currentAppState = {
      graph: baseGraph,
      setSelectedNode,
      selectedNode: null,
      visibleLabels: ['Function'],
      visibleEdgeTypes: [],
      openCodePanel,
      depthFilter: 1,
      highlightedNodeIds: new Set<string>(),
      setHighlightedNodeIds: vi.fn(),
      aiCitationHighlightedNodeIds: new Set<string>(),
      aiToolHighlightedNodeIds: new Set<string>(),
      blastRadiusNodeIds: new Set<string>(),
      isAIHighlightsEnabled: false,
      toggleAIHighlights: vi.fn(),
      animatedNodes: new Map(),
    };

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root!.unmount();
      });
    }
    host?.remove();
    host = null;
    root = null;
    latestSigma = null;
    vi.clearAllMocks();
  });

  it('routes app selected node through useSigma selection sync and updates edge highlighting', async () => {
    const { GraphCanvas } = await import('../../src/components/GraphCanvas');

    await act(async () => {
      root!.render(<GraphCanvas />);
    });

    expect(latestSigma).toBeTruthy();
    latestSigma!.camera.ratio = 1;
    latestSigma!.camera.animate.mockClear();
    latestSigma!.refresh.mockClear();

    currentAppState = {
      ...currentAppState,
      selectedNode: baseGraph.nodes[0],
    };

    await act(async () => {
      root!.render(<GraphCanvas />);
    });

    expect(latestSigma!.camera.animate).toHaveBeenCalledTimes(1);
    const [cameraState, options] = latestSigma!.camera.animate.mock.calls[0];
    expect(cameraState.ratio).toBeCloseTo(1.0001, 6);
    expect(options).toEqual({ duration: 50 });
    expect(latestSigma!.refresh).toHaveBeenCalled();

    const connected = latestSigma!.settings.edgeReducer!('edge-1', { color: '#222222', size: 1 });
    const unrelated = latestSigma!.settings.edgeReducer!('edge-2', { color: '#222222', size: 1 });

    expect(connected.size).toBe(4);
    expect(connected.zIndex).toBe(2);
    expect(unrelated.size).toBe(0.3);
    expect(unrelated.zIndex).toBe(0);

    expect(host!.textContent).toContain('Alpha');
    expect(host!.textContent).toContain('Function');
  });
});
