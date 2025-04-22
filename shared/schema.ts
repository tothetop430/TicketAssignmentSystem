import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Team member model
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  skills: text("skills").array().notNull(),
  initials: text("initials").notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  name: true,
  skills: true,
  initials: true,
});

// Ticket model
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull(),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"),
  assignedTo: integer("assigned_to"),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Validation schema for new tickets
export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  skills: true,
  deadline: true,
  priority: true,
  assignedTo: true,
});

// Activity log model for ticket history
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: jsonb("details"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  ticketId: true,
  action: true,
  details: true,
});

// Export types
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Available skills for the system
export const availableSkills = ["Frontend", "Backend", "Database", "Design"];
