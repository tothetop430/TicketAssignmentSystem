import { teamMembers, tickets, activityLogs } from "@shared/schema";
import type { TeamMember, Ticket, ActivityLog, InsertTeamMember, InsertTicket, InsertActivityLog } from "@shared/schema";
import { availableSkills } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Team Member operations
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  
  // Ticket operations
  getTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  
  // Assignment logic
  assignTicket(ticketId: number, memberId?: number): Promise<Ticket | undefined>;
  completeTicket(ticketId: number): Promise<Ticket | undefined>;
  reopenTicket(ticketId: number): Promise<Ticket | undefined>;
  
  // Activity log operations
  getActivityLogs(ticketId: number): Promise<ActivityLog[]>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Helper for skill-based assignment
  findBestTeamMember(requiredSkills: string[]): Promise<TeamMember | undefined>;
}

// Initial team members data
const initialTeamMembers: InsertTeamMember[] = [
  { name: "John Doe", skills: ["Frontend", "Design"], initials: "JD" },
  { name: "Jane Smith", skills: ["Backend", "Database"], initials: "JS" },
  { name: "Alex Johnson", skills: ["Frontend", "Backend"], initials: "AJ" },
  { name: "Sam Williams", skills: ["Design", "Database"], initials: "SW" },
  { name: "Taylor Green", skills: ["Frontend", "Backend", "Database"], initials: "TG" },
];

export class MemStorage implements IStorage {
  private teamMembers: Map<number, TeamMember>;
  private tickets: Map<number, Ticket>;
  private activityLogs: Map<number, ActivityLog>;
  private teamMemberCurrentId: number;
  private ticketCurrentId: number;
  private activityLogCurrentId: number;

  constructor() {
    this.teamMembers = new Map();
    this.tickets = new Map();
    this.activityLogs = new Map();
    this.teamMemberCurrentId = 1;
    this.ticketCurrentId = 1;
    this.activityLogCurrentId = 1;

    // Populate initial team members
    initialTeamMembers.forEach(member => {
      this.createTeamMember(member);
    });
  }

  // Team Member operations
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.teamMemberCurrentId++;
    const newMember: TeamMember = { ...teamMember, id };
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  // Ticket operations
  async getTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = this.ticketCurrentId++;
    const now = new Date();
    
    const newTicket: Ticket = {
      ...ticket,
      id,
      status: "pending",
      createdAt: now,
      assignedAt: ticket.assignedTo ? now : undefined,
      completedAt: undefined
    };
    
    this.tickets.set(id, newTicket);

    // Add creation activity log
    await this.addActivityLog({
      ticketId: id,
      action: "created",
      details: { ticket: newTicket }
    });

    // If assignedTo is provided, automatically assign the ticket
    if (ticket.assignedTo) {
      return this.assignTicket(id, ticket.assignedTo);
    }

    return newTicket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket = { ...ticket, ...updates };
    this.tickets.set(id, updatedTicket);

    // Add update activity log
    await this.addActivityLog({
      ticketId: id,
      action: "updated",
      details: { updates }
    });

    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    const deleted = this.tickets.delete(id);
    
    if (deleted) {
      // Add deletion activity log
      await this.addActivityLog({
        ticketId: id,
        action: "deleted",
        details: { ticketId: id }
      });
    }
    
    return deleted;
  }

  // Assignment logic
  async assignTicket(ticketId: number, memberId?: number): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    // If no member ID is provided, find the best match based on skills
    if (!memberId) {
      const bestMember = await this.findBestTeamMember(ticket.skills);
      memberId = bestMember?.id;
      if (!memberId) return ticket; // No suitable member found
    }

    // Check if member exists
    const member = this.teamMembers.get(memberId);
    if (!member) return ticket;

    const now = new Date();
    const updatedTicket: Ticket = {
      ...ticket,
      assignedTo: memberId,
      assignedAt: now,
      status: "assigned"
    };

    this.tickets.set(ticketId, updatedTicket);

    // Add assignment activity log
    await this.addActivityLog({
      ticketId,
      action: "assigned",
      details: { memberId, memberName: member.name }
    });

    return updatedTicket;
  }

  async completeTicket(ticketId: number): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const now = new Date();
    const updatedTicket: Ticket = {
      ...ticket,
      completedAt: now,
      status: "completed"
    };

    this.tickets.set(ticketId, updatedTicket);

    // Add completion activity log
    const member = ticket.assignedTo ? this.teamMembers.get(ticket.assignedTo) : undefined;
    await this.addActivityLog({
      ticketId,
      action: "completed",
      details: { 
        completedAt: now,
        completedBy: member ? member.name : "Unknown"
      }
    });

    return updatedTicket;
  }

  async reopenTicket(ticketId: number): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const updatedTicket: Ticket = {
      ...ticket,
      completedAt: undefined,
      status: ticket.assignedTo ? "assigned" : "pending"
    };

    this.tickets.set(ticketId, updatedTicket);

    // Add reopen activity log
    await this.addActivityLog({
      ticketId,
      action: "reopened",
      details: { previousStatus: ticket.status }
    });

    return updatedTicket;
  }

  // Activity log operations
  async getActivityLogs(ticketId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.ticketId === ticketId)
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogCurrentId++;
    const now = new Date();
    
    const newLog: ActivityLog = {
      ...log,
      id,
      timestamp: now
    };
    
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  // Helper for skill-based assignment
  async findBestTeamMember(requiredSkills: string[]): Promise<TeamMember | undefined> {
    if (!requiredSkills.length) return undefined;

    const members = await this.getTeamMembers();
    
    // Count assigned tickets per member for load balancing
    const assignedTicketCount = new Map<number, number>();
    for (const ticket of this.tickets.values()) {
      if (ticket.assignedTo && ticket.status !== "completed") {
        const count = assignedTicketCount.get(ticket.assignedTo) || 0;
        assignedTicketCount.set(ticket.assignedTo, count + 1);
      }
    }

    // Score each team member based on skill match and current workload
    let bestMember: TeamMember | undefined;
    let bestScore = -1;

    for (const member of members) {
      // Calculate skill match score (number of matching skills)
      const matchingSkills = requiredSkills.filter(skill => 
        member.skills.includes(skill)
      );
      
      if (matchingSkills.length === 0) continue; // Skip if no skill match

      // Calculate score based on skill match and inverse of current workload
      const workload = assignedTicketCount.get(member.id) || 0;
      const workloadFactor = 1 / (workload + 1); // +1 to avoid division by zero
      const score = matchingSkills.length * workloadFactor;

      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    }

    return bestMember;
  }
}

export const storage = new MemStorage();
