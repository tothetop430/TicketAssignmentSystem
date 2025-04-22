import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema, insertTeamMemberSchema, availableSkills } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all available skills
  app.get("/api/skills", async (req: Request, res: Response) => {
    res.json(availableSkills);
  });

  // Team Member routes
  app.get("/api/team-members", async (req: Request, res: Response) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      
      // Add assigned ticket count for each member
      const tickets = await storage.getTickets();
      const result = await Promise.all(teamMembers.map(async (member) => {
        const assignedCount = tickets.filter(
          ticket => ticket.assignedTo === member.id && ticket.status !== "completed"
        ).length;
        
        return {
          ...member,
          assignedTicketCount: assignedCount
        };
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team-members/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }
      
      const teamMember = await storage.getTeamMember(id);
      
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.json(teamMember);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets();
      
      // Filter by status if provided
      const status = req.query.status as string;
      let filteredTickets = tickets;
      
      if (status && status !== "all") {
        console.log("Filtering tickets by status:", status);
        
        // Check if this is a comma-separated list of statuses
        if (status.includes(',')) {
          const statusList = status.split(',').map(s => s.trim());
          console.log("Status list:", statusList);
          
          filteredTickets = tickets.filter(ticket => {
            const result = statusList.includes(ticket.status);
            console.log(`Ticket ${ticket.id} has status ${ticket.status}, include: ${result}`);
            return result;
          });
        } else {
          filteredTickets = tickets.filter(ticket => ticket.status === status);
        }
        
        console.log(`Filtered ${tickets.length} tickets to ${filteredTickets.length} tickets`);
      }
      
      // Add team member details for assigned tickets
      const result = await Promise.all(filteredTickets.map(async (ticket) => {
        let assignedMember = null;
        
        if (ticket.assignedTo) {
          assignedMember = await storage.getTeamMember(ticket.assignedTo);
        }
        
        return {
          ...ticket,
          assignedMember
        };
      }));
      
      // Sort tickets by creation date (newest first)
      result.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Get assigned team member if any
      let assignedMember = null;
      if (ticket.assignedTo) {
        assignedMember = await storage.getTeamMember(ticket.assignedTo);
      }
      
      // Get activity logs
      const activityLogs = await storage.getActivityLogs(id);
      
      res.json({
        ...ticket,
        assignedMember,
        activityLogs
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", async (req: Request, res: Response) => {
    try {
      const result = insertTicketSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid ticket data", 
          errors: result.error.formErrors.fieldErrors 
        });
      }
      
      const ticket = result.data;
      
      // Create the ticket
      const createdTicket = await storage.createTicket(ticket);
      
      // If no assignedTo but skills provided, attempt automatic assignment
      if (!ticket.assignedTo && ticket.skills.length > 0) {
        const updatedTicket = await storage.assignTicket(createdTicket.id);
        if (updatedTicket) {
          return res.status(201).json(updatedTicket);
        }
      }
      
      res.status(201).json(createdTicket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.patch("/api/tickets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Validate the updates
      const updateSchema = insertTicketSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: result.error.formErrors.fieldErrors 
        });
      }
      
      const updatedTicket = await storage.updateTicket(id, result.data);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const success = await storage.deleteTicket(id);
      
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Ticket assignment routes
  app.post("/api/tickets/:id/assign", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      // Validate memberId if provided
      const schema = z.object({
        memberId: z.number().optional()
      });
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: result.error.formErrors.fieldErrors 
        });
      }
      
      const { memberId } = result.data;
      const updatedTicket = await storage.assignTicket(id, memberId);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });

  app.post("/api/tickets/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const updatedTicket = await storage.completeTicket(id);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error completing ticket:", error);
      res.status(500).json({ message: "Failed to complete ticket" });
    }
  });

  app.post("/api/tickets/:id/reopen", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const updatedTicket = await storage.reopenTicket(id);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error reopening ticket:", error);
      res.status(500).json({ message: "Failed to reopen ticket" });
    }
  });

  // Activity log routes
  app.get("/api/tickets/:id/activity", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const activityLogs = await storage.getActivityLogs(id);
      res.json(activityLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  return httpServer;
}
