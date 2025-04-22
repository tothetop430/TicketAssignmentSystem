import { apiRequest } from "./queryClient";

// Ticket API functions
export const fetchTickets = async (status?: string) => {
  const url = status ? `/api/tickets?status=${status}` : '/api/tickets';
  const response = await fetch(url, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tickets');
  }
  
  return response.json();
};

export const fetchTicket = async (id: number) => {
  const response = await fetch(`/api/tickets/${id}`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch ticket');
  }
  
  return response.json();
};

export const createTicket = async (ticketData: any) => {
  const response = await apiRequest('POST', '/api/tickets', ticketData);
  return response.json();
};

export const updateTicket = async (id: number, updates: any) => {
  const response = await apiRequest('PATCH', `/api/tickets/${id}`, updates);
  return response.json();
};

export const assignTicket = async (id: number, memberId?: number) => {
  const response = await apiRequest('POST', `/api/tickets/${id}/assign`, { memberId });
  return response.json();
};

export const completeTicket = async (id: number) => {
  const response = await apiRequest('POST', `/api/tickets/${id}/complete`, {});
  return response.json();
};

export const reopenTicket = async (id: number) => {
  const response = await apiRequest('POST', `/api/tickets/${id}/reopen`, {});
  return response.json();
};

// Team Member API functions
export const fetchTeamMembers = async () => {
  const response = await fetch('/api/team-members', { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch team members');
  }
  
  return response.json();
};

export const fetchTeamMember = async (id: number) => {
  const response = await fetch(`/api/team-members/${id}`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch team member');
  }
  
  return response.json();
};

// Activity Log API functions
export const fetchActivityLogs = async (ticketId: number) => {
  const response = await fetch(`/api/tickets/${ticketId}/activity`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }
  
  return response.json();
};
