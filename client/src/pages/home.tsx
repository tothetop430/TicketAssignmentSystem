import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketForm from "@/components/TicketForm";
import TeamMembersList from "@/components/TeamMembersList";
import TicketList from "@/components/TicketList";
import TicketDetailsModal from "@/components/TicketDetailsModal";
import { Ticket } from "@shared/schema";

export default function Home() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  
  // Fetch skills for the system
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
  });

  // Handle ticket selection for details modal
  const handleViewTicket = (ticketId: number) => {
    setSelectedTicket(ticketId);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Form Section */}
          <div className="lg:col-span-4 space-y-6">
            <TicketForm availableSkills={skills || []} />
            <TeamMembersList />
          </div>

          {/* Right Column - Ticket List */}
          <div className="lg:col-span-8">
            <TicketList onViewTicket={handleViewTicket} />
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal 
          ticketId={selectedTicket} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}
