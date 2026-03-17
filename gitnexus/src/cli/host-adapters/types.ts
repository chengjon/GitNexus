export interface McpEntry {
  command: string;
  args: string[];
}

export interface HostDetectionResult {
  detected: boolean;
  reason?: string;
}

export interface HostConfigureResult {
  status: 'configured' | 'manual' | 'skipped' | 'error';
  message?: string;
  manualSteps?: string[];
}

export interface HostDoctorResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface HostAdapter {
  id: string;
  displayName: string;
  detect(): Promise<HostDetectionResult>;
  getMcpEntry(): McpEntry;
  configure(): Promise<HostConfigureResult>;
  manualInstructions(): string[];
}
