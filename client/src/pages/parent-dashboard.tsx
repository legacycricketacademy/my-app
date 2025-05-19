import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SummaryCard } from "@/components/parent/SummaryCard";
import { Schedule } from "@/components/parent/Schedule";
import { Fitness } from "@/components/parent/Fitness";
import { MealPlan } from "@/components/parent/MealPlan";
import { Performance } from "@/components/parent/Performance";
import { ChatBox } from "@/components/parent/ChatBox";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Menu, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ParentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [currentDate] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
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
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.fullName || 'Parent'}</h1>
          <p className="text-muted-foreground">
            {format(currentDate, "EEEE, MMMM d, yyyy")} | Academy Dashboard
          </p>
        </div>

        <Separator className="my-6" />
        
        {/* Summary Cards Section */}
        <div className="mb-8">
          <SummaryCard />
        </div>
        
        {/* Two Column Grid for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Schedule />
          <Fitness />
        </div>
        
        {/* Two Column Grid for Secondary Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MealPlan />
          <Performance />
        </div>
        
        {/* Chat Section */}
        <div className="mb-8">
          <ChatBox />
        </div>
      </main>
    </div>
  );
}