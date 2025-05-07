import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useState } from "react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 characters")
    .optional()
    .nullable()
    .refine(val => !val || /^[0-9+\-\s()]*$/.test(val), 
      "Phone number can only contain digits, +, -, spaces, and parentheses"),
  address: z.string().optional().nullable(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileValues) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ProfileValues) {
    updateProfileMutation.mutate(data);
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!user) {
    return <MainLayout title="Profile">Loading user data...</MainLayout>;
  }

  return (
    <MainLayout title="My Profile">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="bg-primary/5 flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.fullName} />
              ) : null}
              <AvatarFallback className="text-lg">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.fullName}</CardTitle>
              <p className="text-muted-foreground capitalize">{user.role}</p>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-muted-foreground font-medium">Email</dt>
                  <dd className="mt-1">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Phone</dt>
                  <dd className="mt-1">{user.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Address</dt>
                  <dd className="mt-1">{user.address || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Username</dt>
                  <dd className="mt-1">{user.username}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Email Verification</dt>
                  <dd className="mt-1">
                    {user.isEmailVerified ? (
                      <span className="text-green-600 font-medium">Verified</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Pending verification</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Account Status</dt>
                  <dd className="mt-1 capitalize">{user.status}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}