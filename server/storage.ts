import { teamMembers, tickets, activityLogs } from "@shared/schema";
import type { TeamMember, Ticket, ActivityLog, InsertTeamMember, InsertTicket, InsertActivityLog } from "@shared/schema";
import { availableSkills } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed initial team members if they don't exist
    this.seedInitialTeamMembers();
  }

  private async seedInitialTeamMembers() {
    const existingMembers = await db.select().from(teamMembers);
    
    if (existingMembers.length === 0) {
      // No members found, insert initial team members
      for (const member of initialTeamMembers) {
        await db.insert(teamMembers).values(member);
      }
    }
  }

  // Team Member operations
  async getTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers);
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(teamMember).returning();
    return newMember;
  }

  // Ticket operations
  async getTickets(): Promise<Ticket[]> {
    return db.select().from(tickets);
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const now = new Date();
    
    // Prepare ticket data
    const ticketData = {
      ...ticket,
      status: "pending",
      createdAt: now,
      assignedAt: ticket.assignedTo ? now : undefined,
    };
    
    // Insert the ticket and get the newly created ticket
    const [newTicket] = await db.insert(tickets).values(ticketData).returning();

    // Add creation activity log
    await this.addActivityLog({
      ticketId: newTicket.id,
      action: "created",
      details: { ticket: newTicket }
    });

    // If assignedTo is provided, automatically assign the ticket
    if (ticket.assignedTo) {
      return this.assignTicket(newTicket.id, ticket.assignedTo);
    }

    return newTicket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return undefined;

    const [updatedTicket] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();

    // Add update activity log
    await this.addActivityLog({
      ticketId: id,
      action: "updated",
      details: { updates }
    });

    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return false;
    
    await db.delete(tickets).where(eq(tickets.id, id));
    
    // Add deletion activity log
    await this.addActivityLog({
      ticketId: id,
      action: "deleted",
      details: { ticketId: id }
    });
    
    return true;
  }

  // Assignment logic
  async assignTicket(ticketId: number, memberId?: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
    if (!ticket) return undefined;

    // If no member ID is provided, find the best match based on skills
    if (!memberId) {
      const bestMember = await this.findBestTeamMember(ticket.skills);
      memberId = bestMember?.id;
      if (!memberId) return ticket; // No suitable member found
    }

    // Check if member exists
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId));
    if (!member) return ticket;

    const now = new Date();
    const updateData = {
      assignedTo: memberId,
      assignedAt: now,
      status: "assigned"
    };

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    // Add assignment activity log
    await this.addActivityLog({
      ticketId,
      action: "assigned",
      details: { memberId, memberName: member.name }
    });

    return updatedTicket;
  }

  async completeTicket(ticketId: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
    if (!ticket) return undefined;

    const now = new Date();
    const updateData = {
      completedAt: now,
      status: "completed"
    };

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    // Add completion activity log
    let completedBy = "Unknown";
    if (ticket.assignedTo) {
      const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, ticket.assignedTo));
      if (member) {
        completedBy = member.name;
      }
    }
    
    await this.addActivityLog({
      ticketId,
      action: "completed",
      details: { 
        completedAt: now,
        completedBy
      }
    });

    return updatedTicket;
  }

  async reopenTicket(ticketId: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
    if (!ticket) return undefined;

    const updateData = {
      completedAt: null,
      status: ticket.assignedTo ? "assigned" : "pending"
    };

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

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
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.ticketId, ticketId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    
    return newLog;
  }

  // Helper for skill-based assignment
  async findBestTeamMember(requiredSkills: string[]): Promise<TeamMember | undefined> {
    if (!requiredSkills.length) return undefined;

    const members = await this.getTeamMembers();
    
    // Count assigned tickets per member for load balancing
    const assignedTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          tickets.status !== "completed",
          tickets.assignedTo !== null
        )
      );
    
    const assignedTicketCount = new Map<number, number>();
    for (const ticket of assignedTickets) {
      if (ticket.assignedTo) {
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

// Use the database storage implementation
export const storage = new DatabaseStorage();
