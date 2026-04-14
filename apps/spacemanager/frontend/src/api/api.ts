import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

export type Floor = {
  id: number;
  name: string;
  mapImageUrl: string;
  layoutData?: string;
};

export type Organization = {
  id: number;
  name: string;
  level: number;
};

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

export type OrganizationTree = {
  id: number;
  name: string;
  level: number;
  parentId?: number | null;
  isExecutiveUnit: boolean;
  memberCount: number;
  directMemberCount: number;
  children: OrganizationTree[];
};

export type SpaceAssignment = {
  id: number;
  floorId: number;
  orgId: number;
  orgName: string;
  areaPolygon: string;
  color: string;
};

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

export const deleteOrganization = async (id: number): Promise<void> => {
  await api.delete(`/organizations/${id}`);
};

export type OrganizationDto = {
  id?: number;
  name: string;
  level: number;
  parentId?: number | null;
  isExecutiveUnit: boolean;
  memberCount: number;
};

export const createOrganization = async (dto: OrganizationDto): Promise<OrganizationDto> => {
  const response = await api.post('/organizations', dto);
  return response.data;
};

export const updateOrganization = async (id: number, dto: OrganizationDto): Promise<OrganizationDto> => {
  const response = await api.put(`/organizations/${id}`, dto);
  return response.data;
};

export interface BulkAssignRequest {
  teams: string[];
  teamColors: string[];
  memberNames: string[];
  seatIds: number[];
}

export const bulkAssignSeats = async (request: BulkAssignRequest): Promise<void> => {
  await api.post('/seats/bulk-assign', request);
};

export const moveSeat = async (fromSeatId: number, toSeatId: number): Promise<void> => {
  await api.post('/seats/move', { fromSeatId, toSeatId });
};

export const clearFloorReservations = async (floorId: number): Promise<void> => {
  await api.delete(`/seats/floor/${floorId}`);
};

export const cancelSeatReservation = async (seatId: number): Promise<void> => {
  await api.delete(`/seats/reservations/seat/${seatId}`);
};

export default api;
