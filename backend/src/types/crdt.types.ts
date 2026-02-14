export interface Node {
  id: string;
  content: string;
  x: number;
  y: number;
  createdBy: string;
  createdAt: number;
}

export interface NodeUpdate {
  id: string;
  x?: number;
  y?: number;
  content?: string;
}
