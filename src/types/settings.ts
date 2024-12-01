export type DispatchMode = 'auto' | 'dispatcher';

export interface SystemSettings {
  id: string;
  dispatchMode: DispatchMode;
  updatedAt: number;
  updatedBy: string;
} 