import React, { act, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

class MockGraph {
  nodes = new Map<string, { x: number; y: number }>();
  order = 0;

  addNode(nodeId: string, attrs: { x: number; y: number }) {
    this.nodes.set(nodeId, attrs);
    this.order = this.nodes.size;
  }

  hasNode(nodeId: string) {
    return this.nodes.has(nodeId);
  }

  getNodeAttributes(nodeId: string) {
    const attrs = this.nodes.get(nodeId);
    if (!attrs) {
      throw new Error(`Missing mock node: ${nodeId}`);
    }
    return attrs;
  }

  hasEdge() {
    return false;
  }

  extremities() {
    return ['', ''];
  }
}

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
};

let latestGraph: MockGraph | null = null;
let latestSigma: SigmaMock | null = null;
const fa2Start = vi.fn();
const fa2Stop = vi.fn();
const fa2Kill = vi.fn();
const noverlapAssign = vi.fn();
const inferSettings = vi.fn(() => ({}));

vi.mock('graphology', () => ({
  default: class GraphologyMock extends MockGraph {
    constructor() {
      super();
      latestGraph = this;
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

    constructor(graph: MockGraph, container: HTMLDivElement) {
      this.graph = graph;
      this.container = container;
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
