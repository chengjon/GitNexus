import type mermaid from 'mermaid';

type MermaidInstance = typeof mermaid;

const MERMAID_RUNTIME_ASSET_PATH = '/vendor/mermaid/mermaid.esm.min.mjs';

let mermaidPromise: Promise<MermaidInstance> | null = null;

const loadMermaid = async (): Promise<MermaidInstance> => {
  if (!mermaidPromise) {
    mermaidPromise = (
      import.meta.env.PROD
        ? import(/* @vite-ignore */ MERMAID_RUNTIME_ASSET_PATH)
        : import('mermaid')
    ).then((module) => module.default);
  }

  return mermaidPromise;
};

export const getInlineMermaid = async (): Promise<MermaidInstance> => {
  const instance = await loadMermaid();

  instance.initialize({
    startOnLoad: false,
    maxTextSize: 900000,
    theme: 'base',
    themeVariables: {
      primaryColor: '#1e293b',
      primaryTextColor: '#f1f5f9',
      primaryBorderColor: '#22d3ee',
      lineColor: '#94a3b8',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a',
      mainBkg: '#1e293b',
      nodeBorder: '#22d3ee',
      clusterBkg: '#1e293b',
      clusterBorder: '#475569',
      titleColor: '#f1f5f9',
      edgeLabelBackground: '#0f172a',
    },
    flowchart: {
      curve: 'basis',
      padding: 15,
      nodeSpacing: 50,
      rankSpacing: 50,
      htmlLabels: true,
    },
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 13,
    suppressErrorRendering: true,
  });

  instance.parseError = () => {
    // Silent catch for streaming previews.
  };

  return instance;
};

export const getProcessFlowMermaid = async (): Promise<MermaidInstance> => {
  const instance = await loadMermaid();

  instance.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    maxTextSize: 900000,
    theme: 'base',
    themeVariables: {
      primaryColor: '#1e293b',
      primaryTextColor: '#f1f5f9',
      primaryBorderColor: '#22d3ee',
      lineColor: '#94a3b8',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a',
      mainBkg: '#1e293b',
      nodeBorder: '#22d3ee',
      clusterBkg: '#1e293b',
      clusterBorder: '#475569',
      titleColor: '#f1f5f9',
      edgeLabelBackground: '#0f172a',
    },
    flowchart: {
      curve: 'basis',
      padding: 50,
      nodeSpacing: 120,
      rankSpacing: 140,
      htmlLabels: true,
    },
  });

  instance.parseError = (error) => {
    console.debug('Mermaid parse error (suppressed):', error);
  };

  return instance;
};
