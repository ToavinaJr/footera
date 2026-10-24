import { apiClient } from '../lib/api/client';

export type RequestableRole = 'Gestionnaire Terrain' | 'Entraîneur' | 'Organisateur Tournoi' | 'Vendeur';
export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RoleRequest {
  id: string;
  userId: string;
  role: RequestableRole;
  status: RoleRequestStatus;
  reason?: string;
  createdAt: string;
}

export interface RoleRequestsData {
  availableRoles: RequestableRole[];
  requests: RoleRequest[];
}

export const roleRequestsService = {
  list(): Promise<RoleRequestsData> {
    return apiClient<RoleRequestsData>('role-requests');
  },
  create(input: { role: RequestableRole; reason?: string }): Promise<RoleRequest> {
    return apiClient<RoleRequest>('role-requests', { method: 'POST', body: JSON.stringify(input) });
  },
};
