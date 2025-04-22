import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface TicketDetailsModalProps {
  ticketId: number;
  onClose: () => void;
}

export default function TicketDetailsModal({ ticketId, onClose }: TicketDetailsModalProps) {
  const { toast } = useToast();
  
  // Fetch ticket details
  const { data: ticket, isLoading } = useQuery({
    queryKey: [`/api/tickets/${ticketId}`],
  });

  // Complete ticket mutation
  const completeTicket = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
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

  // Reopen ticket mutation
  const reopenTicket = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/reopen`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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

  // Helper function to determine priority color class
  const getPriorityClasses = (priority: string) => {
    switch(priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state
  if (isLoading || !ticket) {
    return (
      <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                onClick={onClose}
                variant="outline"
                className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {ticket.title}
                </h3>
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClasses(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {ticket.description}
                  </p>
                  
                  <div className="border-t border-gray-200 py-3">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Created on</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formatDate(ticket.createdAt)}
                        </dd>
                      </div>
                      {ticket.assignedTo && ticket.assignedMember && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {ticket.assignedMember.name}
                          </dd>
                        </div>
                      )}
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Due date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(ticket.deadline).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </dd>
                      </div>
                      {ticket.assignedAt && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Assigned on</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(ticket.assignedAt)}
                          </dd>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Required skills</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1">
                            {ticket.skills.map((skill: string) => {
                              // Different background colors for different skills
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
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                                >
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  {/* Activity Log */}
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-900">Activity Log</h4>
                    {ticket.activityLogs && ticket.activityLogs.length > 0 ? (
                      <ul className="mt-2 space-y-3">
                        {ticket.activityLogs.map((log: any) => (
                          <li key={log.id} className="text-xs text-gray-500">
                            <div className="flex items-start">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900">
                                  {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                                  {log.action === "assigned" && log.details?.memberName && 
                                    ` to ${log.details.memberName}`}
                                  {log.action === "completed" && log.details?.completedBy && 
                                    ` by ${log.details.completedBy}`}
                                </p>
                                <p>{formatDate(log.timestamp)}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">No activity logs available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Close
            </Button>
            
            {ticket.status === "assigned" && (
              <Button
                onClick={() => completeTicket.mutate()}
                disabled={completeTicket.isPending}
                className="w-full sm:w-auto"
              >
                {completeTicket.isPending ? "Processing..." : "Mark as Completed"}
              </Button>
            )}
            
            {ticket.status === "completed" && (
              <Button
                onClick={() => reopenTicket.mutate()}
                disabled={reopenTicket.isPending}
                className="w-full sm:w-auto"
              >
                {reopenTicket.isPending ? "Processing..." : "Reopen Ticket"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
