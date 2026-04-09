declare module 'react-syntax-highlighter/dist/esm/prism-light' {
  import * as React from 'react';
  import { SyntaxHighlighterProps } from 'react-syntax-highlighter';

  export default class SyntaxHighlighter extends React.Component<SyntaxHighlighterProps> {
    static registerLanguage(name: string, func: any): void;
    static alias(name: string, alias: string | string[]): void;
    static alias(aliases: Record<string, string | string[]>): void;
  }
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus' {
  const style: Record<string, any>;
  export default style;
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
  const language: any;
  export default language;
}
