import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SimpleLogoutButton() {
  const handleSimpleLogout = () => {
    // This is a direct bypass of all auth logic
    try {
      // Clear any session data
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Remove any stored auth state
      localStorage.setItem('logged_out', 'true');
      
      // Redirect to auth page
      window.location.href = "/auth";
      
      // For extra certainty, reload after 200ms
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect
      window.location.href = "/auth";
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
      onClick={handleSimpleLogout}
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Emergency Sign Out</span>
    </Button>
  );
}