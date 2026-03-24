import type { ToolContext } from './tool-context.js';

export type ToolHandler = (ctx: ToolContext, params: any) => Promise<any>;

export interface ToolRegistry {
  dispatch(method: string, ctx: ToolContext, params: any): Promise<any>;
}

const TOOL_ALIASES: Record<string, string> = {
  search: 'query',
  explore: 'context',
};

export function createToolRegistry(handlers: Record<string, ToolHandler>): ToolRegistry {
  return {
    async dispatch(method: string, ctx: ToolContext, params: any): Promise<any> {
      const resolvedMethod = TOOL_ALIASES[method] || method;
      const hasHandler = Object.prototype.hasOwnProperty.call(handlers, resolvedMethod);
      const handler = hasHandler ? handlers[resolvedMethod] : undefined;
      if (typeof handler !== 'function') {
        throw new Error(`Unknown tool: ${method}`);
      }
      return handler(ctx, params);
    },
  };
}
