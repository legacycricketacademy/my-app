import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Calendar, MapPin, ArrowRight, UserPlus } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-700 font-medium" data-testid="loading-kids">Loading your kids...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="error-heading">Error Loading Kids</h2>
              <p className="text-gray-600">
                Failed to load your kids. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-6 md:py-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900" data-testid="heading-kids-list">My Kids</h1>
          <p className="text-gray-600 text-base md:text-lg">
            View and manage your children's cricket training
          </p>
        </div>

        {kids.length === 0 ? (
          /* Empty State */}
          <div className="flex items-center justify-center py-8 md:py-12">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center space-y-4 md:space-y-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <UserPlus className="h-10 w-10 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900" data-testid="no-kids-heading">No Kids Found</h3>
                  <p className="text-gray-600">
                    You don't have any kids registered yet. Connect a child to get started.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/parent/connect-child")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm"
                  data-testid="btn-connect-child"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Connect a Child
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Kids Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {kids.map((kid) => (
              <div
                key={kid.id}
                data-testid="kid-card"
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/parent/kids/${kid.id}`)}
              >
                {/* Card Header with Avatar */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50">
                  <div className="flex items-center gap-4">
                    {kid.profileImage ? (
                      <img
                        src={kid.profileImage}
                        alt={kid.fullName}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                        data-testid="kid-avatar"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-md">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900" data-testid="kid-name">{kid.fullName}</h3>
                      <p className="text-gray-600 font-medium" data-testid="kid-age">Age {kid.age}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                      <span className="font-medium" data-testid="kid-age-group">{kid.ageGroup}</span>
                    </div>
                    {kid.location && (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-3 text-green-600" />
                        <span data-testid="kid-location">{kid.location}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-sm group-hover:shadow-md transition-all"
                    data-testid="btn-view-dashboard"
                  >
                    View Dashboard
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
