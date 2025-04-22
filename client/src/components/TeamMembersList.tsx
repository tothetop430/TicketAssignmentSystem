import { useQuery } from "@tanstack/react-query";

export default function TeamMembersList() {
  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/team-members'],
    refetchInterval: 2000, // Refetch team members every 2 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>
        <div className="animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start p-3 border border-gray-200 rounded-md">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="ml-3 w-full">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="mt-2 flex gap-1">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="mt-2 h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>
      <div className="space-y-4">
        {teamMembers.map((member: any) => (
          <div key={member.id} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
              {member.initials}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">{member.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {member.skills.map((skill: string, index: number) => {
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
                      key={index} 
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Assigned Tickets: <span className="font-medium">{member.assignedTicketCount}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
