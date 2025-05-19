import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div onClick={() => navigate("/dashboard/parent")} className="cursor-pointer">
              <div className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer">
                <span className="bg-primary text-white p-1 rounded">
                  🏏
                </span>
                <span className="hidden md:inline">Legacy Cricket Academy</span>
                <span className="md:hidden">LCA</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div onClick={() => navigate("/dashboard/parent")} className="cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">Dashboard</span>
            </div>
            <div onClick={() => navigate("/parent/schedule")} className="cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">Schedule</span>
            </div>
            <div onClick={() => navigate("/parent/fitness")} className="cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">Fitness</span>
            </div>
            <div onClick={() => navigate("/parent/meal-plans")} className="cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">Meal Plans</span>
            </div>
            <div onClick={() => navigate("/parent/performance")} className="cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">Performance</span>
            </div>
          </div>

          {/* User Menu & Notifications */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-200">
              <Bell size={20} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-gray-200 dark:border-gray-800 mt-3">
            <div className="flex flex-col space-y-3">
              <div onClick={() => navigate("/dashboard/parent")} className="cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary block px-3 py-2">Dashboard</span>
              </div>
              <div onClick={() => navigate("/parent/schedule")} className="cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary block px-3 py-2">Schedule</span>
              </div>
              <div onClick={() => navigate("/parent/fitness")} className="cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary block px-3 py-2">Fitness</span>
              </div>
              <div onClick={() => navigate("/parent/meal-plans")} className="cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary block px-3 py-2">Meal Plans</span>
              </div>
              <div onClick={() => navigate("/parent/performance")} className="cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary block px-3 py-2">Performance</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}