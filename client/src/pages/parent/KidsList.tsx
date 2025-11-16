import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, MapPin, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface Kid {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  ageGroup: string;
  location: string;
  profileImage: string | null;
}

export default function KidsList() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/parent/kids"],
    queryFn: () => api.get("/parent/kids"),
  });

  const kids: Kid[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading your kids...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Kids</CardTitle>
            <CardDescription>
              Failed to load your kids. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Kids</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your children's cricket training
        </p>
      </div>

      {kids.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Kids Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any kids registered yet.
            </p>
            <Button onClick={() => navigate("/parent/connect-child")}>
              Connect a Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kids.map((kid) => (
            <Card
              key={kid.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/parent/kids/${kid.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  {kid.profileImage ? (
                    <img
                      src={kid.profileImage}
                      alt={kid.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-xl">{kid.fullName}</CardTitle>
                    <CardDescription>Age {kid.age}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{kid.ageGroup}</span>
                </div>
                {kid.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{kid.location}</span>
                  </div>
                )}
                <Button className="w-full mt-4" variant="outline">
                  View Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
