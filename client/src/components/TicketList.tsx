import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar, Clock, CloudLightning } from "lucide-react";

interface TicketListProps {
  onViewTicket: (ticketId: number) => void;
}

export default function TicketList({ onViewTicket }: TicketListProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/tickets', statusFilter],
    queryFn: async ({ queryKey }) => {
      const status = queryKey[1];
      const url = status === "all" 
        ? '/api/tickets' 
        : `/api/tickets?status=${status}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
    refetchInterval: 2000, // Refetch tickets every 2 seconds
  });

  // Assign ticket mutation
  const assignTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/assign`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket Assigned",
        description: "The ticket has been assigned based on required skills",
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Reassign ticket mutation
  const reassignTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/assign`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket Reassigned",
        description: "The ticket has been reassigned to another team member",
      });
    },
    onError: (error) => {
      toast({
        title: "Reassignment Failed",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Reopen ticket mutation
  const reopenTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/reopen`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket Reopened",
        description: "The ticket has been reopened",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Reopen",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Complete ticket mutation
  const completeTicket = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket Completed",
        description: "The ticket has been marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Complete",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle tab change
  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setStatusFilter(status === "all" ? "all" : status === "open" ? "pending,assigned" : "completed");
  };

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((ticket: any) => {
    return (
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Helper function to determine status color class
  const getStatusClasses = (status: string) => {
    switch(status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "assigned":
        return "bg-violet-100 text-violet-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format skills with colors
  const renderSkillBadge = (skill: string) => {
    const colors = {
      "Frontend": "bg-blue-100 text-blue-800",
      "Backend": "bg-green-100 text-green-800",
      "Database": "bg-yellow-100 text-yellow-800",
      "Design": "bg-purple-100 text-purple-800"
    };
    
    const colorClass = colors[skill as keyof typeof colors] || "bg-gray-100 text-gray-800";
    
    return (
      <span 
        key={skill} 
        className={`inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {skill}
      </span>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="border-b border-gray-200">
              <div className="flex">
                <div className="w-1/3 py-3 text-center border-b-2 border-gray-200">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="w-1/3 py-3 text-center border-b-2 border-gray-200">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="w-1/3 py-3 text-center border-b-2 border-gray-200">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Tickets</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  className="px-3 py-2 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="px-3 py-2 text-sm w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button 
                className={`w-1/3 py-3 text-center border-b-2 ${
                  activeTab === "all" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                } font-medium text-sm`}
                onClick={() => handleTabChange("all")}
              >
                All Tickets
                <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tickets.length}
                </span>
              </button>
              <button 
                className={`w-1/3 py-3 text-center border-b-2 ${
                  activeTab === "open" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                } font-medium text-sm`}
                onClick={() => handleTabChange("open")}
              >
                Open
                <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tickets.filter((t: any) => t.status !== "completed").length}
                </span>
              </button>
              <button 
                className={`w-1/3 py-3 text-center border-b-2 ${
                  activeTab === "closed" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                } font-medium text-sm`}
                onClick={() => handleTabChange("closed")}
              >
                Closed
                <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tickets.filter((t: any) => t.status === "completed").length}
                </span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tickets found. Create a new ticket to get started.
          </div>
        ) : (
          filteredTickets.map((ticket: any) => (
            <div key={ticket.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-900">{ticket.title}</h3>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Skills:</span>
                      {ticket.skills.map((skill: string) => renderSkillBadge(skill))}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {new Date(ticket.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center">
                      <CloudLightning className="h-4 w-4 mr-1" />
                      Priority: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </div>
                    {ticket.assignedTo && ticket.assignedMember && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Assigned to: {ticket.assignedMember.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-2">
                  {ticket.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => assignTicket.mutate(ticket.id)}
                      disabled={assignTicket.isPending}
                    >
                      Assign
                    </Button>
                  )}
                  
                  {ticket.status === "assigned" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reassignTicket.mutate(ticket.id)}
                      disabled={reassignTicket.isPending}
                    >
                      Reassign
                    </Button>
                  )}
                  
                  {ticket.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reopenTicket.mutate(ticket.id)}
                      disabled={reopenTicket.isPending}
                    >
                      Reopen
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredTickets.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTickets.length}</span> of <span className="font-medium">{tickets.length}</span> tickets
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  disabled
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                <Button
                  className="z-10 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  disabled
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  disabled
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
          <div className="flex sm:hidden">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="ml-3" disabled>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
