export interface ExtractedRoute {
  filePath: string;
  httpMethod: string;
  routePath: string | null;
  controllerName: string | null;
  methodName: string | null;
  middleware: string[];
  prefix: string | null;
  lineNumber: number;
}
