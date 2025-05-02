import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  MoreHorizontal 
} from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
      <div className="flex items-center justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive('/') ? 'text-primary' : 'text-gray-600'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/players">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive('/players') ? 'text-primary' : 'text-gray-600'}`}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Players</span>
          </a>
        </Link>
        
        <Link href="/schedule">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive('/schedule') ? 'text-primary' : 'text-gray-600'}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Schedule</span>
          </a>
        </Link>
        
        <Link href="/payments">
          <a className={`flex flex-col items-center py-2 px-3 ${isActive('/payments') ? 'text-primary' : 'text-gray-600'}`}>
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Payments</span>
          </a>
        </Link>
        
        <Link href="/more">
          <a className={`flex flex-col items-center py-2 px-3 ${
            isActive('/fitness') || 
            isActive('/meal-plans') || 
            isActive('/announcements') || 
            isActive('/settings') ? 'text-primary' : 'text-gray-600'
          }`}>
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
