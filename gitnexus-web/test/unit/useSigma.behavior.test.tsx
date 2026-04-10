import React, { act, useEffect } from 'react';
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
  nodeReducer?: (node: string, data: Record<string, unknown>) => Record<string, unknown>;
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
      if (!attrs) {
        throw new Error(`Missing mock node: ${nodeId}`);
      }
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
      if (!edge) {
        throw new Error(`Missing mock edge: ${edgeId}`);
      }
      return edge;
    },
  };
  return graph;
};

type CameraMock = {
  ratio: number;
  animate: ReturnType<typeof vi.fn>;
  animatedReset: ReturnType<typeof vi.fn>;
  animatedZoom: ReturnType<typeof vi.fn>;
  animatedUnzoom: ReturnType<typeof vi.fn>;
};

type SigmaMock = {
  camera: CameraMock;
  refresh: ReturnType<typeof vi.fn>;
  setGraph: ReturnType<typeof vi.fn>;
  getGraph: ReturnType<typeof vi.fn>;
  getCamera: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  graph: MockGraph;
  container: HTMLDivElement;
  settings: SigmaSettings;
};

let latestGraph: MockGraph | null = null;
let latestSigma: SigmaMock | null = null;
const fa2Start = vi.fn();
const fa2Stop = vi.fn();
const fa2Kill = vi.fn();
const noverlapAssign = vi.fn();
const inferSettings = vi.fn(() => ({}));

vi.mock('graphology', () => ({
  default: class GraphologyMock {
    constructor() {
      const graph = createMockGraph();
      latestGraph = graph;
      return graph;
    }
  },
}));

vi.mock('sigma', () => ({
  default: class SigmaMockClass {
    camera: CameraMock;
    refresh: ReturnType<typeof vi.fn>;
    setGraph: ReturnType<typeof vi.fn>;
    getGraph: ReturnType<typeof vi.fn>;
    getCamera: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    kill: ReturnType<typeof vi.fn>;
    graph: MockGraph;
    container: HTMLDivElement;
    settings: SigmaSettings;

    constructor(graph: MockGraph, container: HTMLDivElement, settings: SigmaSettings) {
      this.graph = graph;
      this.container = container;
      this.settings = settings;
      this.camera = {
        ratio: 1,
        animate: vi.fn((next: { ratio?: number }) => {
          if (typeof next.ratio === 'number') {
            this.camera.ratio = next.ratio;
          }
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
  default: vi.fn().mockImplementation(() => ({
    start: fa2Start,
    stop: fa2Stop,
    kill: fa2Kill,
  })),
}));

vi.mock('graphology-layout-forceatlas2', () => ({
  default: {
    inferSettings,
  },
}));

vi.mock('graphology-layout-noverlap', () => ({
  default: {
    assign: noverlapAssign,
  },
}));

vi.mock('@sigma/edge-curve', () => ({
  default: class EdgeCurveProgramMock {},
}));

describe('useSigma runtime behavior', () => {
  let root: Root | null = null;
  let host: HTMLDivElement | null = null;
  let hookApi: any = null;

  beforeEach(() => {
    latestGraph = null;
    latestSigma = null;
    hookApi = null;
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
    root = null;
    host = null;
    latestGraph = null;
    latestSigma = null;
    hookApi = null;
    vi.clearAllMocks();
  });

  const renderHookHarness = async () => {
    const { useSigma } = await import('../../src/hooks/useSigma');

    function Harness() {
      const api = useSigma();
      useEffect(() => {
        hookApi = api;
      }, [api]);
      return <div ref={api.containerRef} />;
    }

    await act(async () => {
      root!.render(<Harness />);
    });

    expect(hookApi).toBeTruthy();
    expect(latestSigma).toBeTruthy();
    expect(latestGraph).toBeTruthy();
    expect(latestSigma!.settings.edgeReducer).toBeTypeOf('function');
  };

  it('keeps the selection path on the camera-nudge refresh behavior', async () => {
    await renderHookHarness();

    latestSigma!.camera.animate.mockClear();
    latestSigma!.refresh.mockClear();

    await act(async () => {
      hookApi.setSelectedNode('node-1');
    });

    expect(latestSigma!.camera.animate).toHaveBeenCalledTimes(1);
    const [nextCameraState, animationOptions] = latestSigma!.camera.animate.mock.calls[0];
    expect(nextCameraState.ratio).toBeCloseTo(1.0001, 6);
    expect(animationOptions).toEqual({ duration: 50 });
    expect(latestSigma!.refresh).toHaveBeenCalledTimes(1);
  });

  it('updates edge highlighting state when setSelectedNode selects a node', async () => {
    await renderHookHarness();

    latestGraph!.addNode('node-1', { x: 12, y: 34 });
    latestGraph!.addNode('node-2', { x: 30, y: 45 });
    latestGraph!.addNode('node-3', { x: 60, y: 75 });
    latestGraph!.addEdge('edge-connected', 'node-1', 'node-2');
    latestGraph!.addEdge('edge-unrelated', 'node-2', 'node-3');

    await act(async () => {
      hookApi.setSelectedNode('node-1');
    });

    const connected = latestSigma!.settings.edgeReducer!('edge-connected', { color: '#222222', size: 1 });
    const unrelated = latestSigma!.settings.edgeReducer!('edge-unrelated', { color: '#222222', size: 1 });

    expect(connected.size).toBe(4);
    expect(connected.zIndex).toBe(2);
    expect(connected.color).not.toBe('#222222');

    expect(unrelated.size).toBe(0.3);
    expect(unrelated.zIndex).toBe(0);
    expect(unrelated.color).not.toBe('#222222');
  });

  it('keeps focusNode on the direct focus path without the camera nudge', async () => {
    await renderHookHarness();

    latestGraph!.addNode('node-1', { x: 12, y: 34 });
    latestSigma!.camera.animate.mockClear();
    latestSigma!.refresh.mockClear();

    await act(async () => {
      hookApi.focusNode('node-1');
    });

    expect(latestSigma!.camera.animate).toHaveBeenCalledTimes(1);
    expect(latestSigma!.camera.animate).toHaveBeenCalledWith(
      { x: 12, y: 34, ratio: 0.15 },
      { duration: 400 },
    );
    expect(latestSigma!.refresh).toHaveBeenCalledTimes(1);

    latestSigma!.camera.animate.mockClear();
    latestSigma!.refresh.mockClear();

    await act(async () => {
      hookApi.focusNode('node-1');
    });

    expect(latestSigma!.camera.animate).not.toHaveBeenCalled();
    expect(latestSigma!.refresh).toHaveBeenCalledTimes(1);
  });
});
