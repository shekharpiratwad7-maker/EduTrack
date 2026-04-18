import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#1a2035] to-[#0a0e1a] p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#ff4d6d]/20 flex items-center justify-center">
            <AlertCircle size={48} className="text-[#ff4d6d]" />
          </div>
        </div>
        <h1 className="text-8xl font-extrabold text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-[#6b778f] mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/signin">
          <Button className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90">
            <Home size={20} className="mr-2" />
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
