import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { login, initKeycloak } from "@/auth/keycloak";

export default function AuthPageLocal() {
  useEffect(() => {
    initKeycloak();
  }, []);

  const handleKeycloakLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Legacy Cricket Academy</CardTitle>
          <CardDescription>Login with Keycloak to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleKeycloakLogin}
            className="w-full"
            size="lg"
          >
            Login with Keycloak
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
