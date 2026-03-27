export interface Organization {
  id?: number;
  name: string;
  level: number;
  parentId?: number | null;
  isExecutiveUnit: boolean;
}

export interface User {
  id?: number;
  name: string;
  role: 'Executive' | 'Leader' | 'Member';
  orgId: number;
}

export interface Floor {
  id?: number;
  name: string;
  mapImageUrl?: string;
  layoutData?: any;
}

export interface Seat {
  id?: number;
  floorId: number;
  seatNumber: string;
  xPos: number;
  yPos: number;
  isExecutiveSeat: boolean;
}

export interface SpaceAssignment {
  id?: number;
  floorId: number;
  orgId: number;
  areaPolygon: string;
}

export interface SimulationRequest {
  weights: { [key: string]: number };
  floorIds: number[];
}
