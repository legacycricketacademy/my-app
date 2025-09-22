import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { Search, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMobile } from "@/hooks/use-mobile";
import { AdminNotificationDropdown } from "@/components/admin-notification-dropdown";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { signOut } from "@/lib/auth";
import { useLocation } from "wouter";
import { safeInitials } from "@/lib/strings";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [searchFocused, setSearchFocused] = useState(false);
  const [, setLocation] = useLocation();
  
  // Removed getInitials - now using safeInitials from strings.ts

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/auth');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            
            {/* Page Title (mobile only) */}
            <div className="md:hidden flex items-center">
              <span className="text-xl font-bold text-primary heading">Legacy Cricket Academy</span>
            </div>
            
            {/* Search (shown on larger screens) */}
            <div className="hidden md:flex items-center flex-1 mx-4">
              <div className="relative w-full max-w-md">
                <input 
                  type="text" 
                  placeholder="Search players, schedules, etc." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <Search className={`absolute left-3 top-2.5 h-5 w-5 ${searchFocused ? 'text-primary' : 'text-gray-500'}`} />
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              <RoleBadge />
              <AdminNotificationDropdown />
              
              {/* User dropdown - Desktop */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage || undefined} alt={user?.name || "User"} />
                        <AvatarFallback>{safeInitials(user?.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Mobile avatar */}
              <div className="relative md:hidden">
                <Avatar>
                  <AvatarImage src={user?.profileImage || undefined} alt={user?.name || "User"} />
                  <AvatarFallback>{safeInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          
          {/* Mobile Search - Collapsible */}
          <div className="p-2 md:hidden border-t border-gray-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search players, schedules, etc." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <Search className={`absolute left-3 top-2.5 h-5 w-5 ${searchFocused ? 'text-primary' : 'text-gray-500'}`} />
            </div>
          </div>
        </header>
        
        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
