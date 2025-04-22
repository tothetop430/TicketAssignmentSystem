export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} Ticket Assignment System. All rights reserved.</p>
      </div>
    </footer>
  );
}
