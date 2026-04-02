import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

export interface Floor {
  id: number;
  name: string;
  mapImageUrl: string;
  layoutData?: string;
}

export interface Organization {
  id: number;
  name: string;
  level: number;
}

export interface Seat {
  id: number;
  seatNumber: string;
  xPos: number;
  yPos: number;
  sectionName?: string;
  isExecutiveSeat: boolean;
  status: 'available' | 'occupied';
  occupantName?: string;
  teamName?: string;
  teamColor?: string;
}

export interface OrganizationTree {
  id: number;
  name: string;
  level: number;
  isExecutiveUnit: boolean;
  memberCount: number;
  children: OrganizationTree[];
}

export interface SpaceAssignment {
  id: number;
  floorId: number;
  orgId: number;
  orgName: string;
  areaPolygon: string;
  color: string;
}

export const fetchFloors = async (): Promise<Floor[]> => {
  const response = await api.get('/floors');
  return response.data;
};

export const fetchOrganizationTree = async (): Promise<OrganizationTree[]> => {
  const response = await api.get('/organizations/tree');
  return response.data;
};

export const fetchSeats = async (floorId: number): Promise<Seat[]> => {
  const response = await api.get(`/seats/floor/${floorId}`);
  return response.data;
};

export interface SimulationRequest {
  weights: Record<string, number>;
  floorIds: number[];
}

export const runSimulation = async (request: SimulationRequest): Promise<Record<number, number>> => {
  const response = await api.post('/simulation/recommend', request);
  return response.data;
};

export const applySimulation = async (assignments: Record<number, number>): Promise<void> => {
  await api.post('/simulation/apply', assignments);
};

export const uploadBulkData = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/bulk/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export interface AssignmentSaveRequest {
  floorId: number;
  orgId: number;
  areaPolygon: string;
}

export const saveAssignment = async (request: AssignmentSaveRequest): Promise<SpaceAssignment> => {
  const response = await api.post('/assignments', request);
  return response.data;
};

export const fetchAssignments = async (floorId: number): Promise<SpaceAssignment[]> => {
  const response = await api.get(`/floors/${floorId}/assignments`);
  return response.data;
};

export const fetchOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get('/organizations');
  return response.data;
};

export const reserveSeat = async (seatId: number, userId: number) => {
  return await api.post(`/seats/${seatId}/reserve?userId=${userId}`);
};

export default api;
