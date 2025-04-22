import { useQuery } from "@tanstack/react-query";

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Ticket Assignment System</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, Admin</span>
            <button className="text-sm text-primary hover:text-primary-dark">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}
