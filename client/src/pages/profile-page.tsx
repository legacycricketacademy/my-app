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
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

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
  
  // Email verification mutation
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const sendVerificationEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/verify-email/send");
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationEmailSent(true);
      
      // If we have a direct verification link (in case email fails)
      if (data.verificationLink) {
        setVerificationLink(data.verificationLink);
        toast({
          title: data.status === "warning" ? "Email Service Unavailable" : "Verification Link Generated",
          description: data.message,
          variant: data.status === "warning" ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Verification Link",
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
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.fullName} />
              ) : null}
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{user.fullName}</CardTitle>
              <p className="text-muted-foreground capitalize flex items-center gap-1 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                {user.role}
              </p>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                className="ml-auto border-primary/20 hover:bg-primary/5 text-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4">
                          <FormLabel className="text-sm font-medium text-muted-foreground">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="mt-2 bg-gray-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4">
                          <FormLabel className="text-sm font-medium text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input {...field} className="mt-2 bg-gray-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4">
                          <FormLabel className="text-sm font-medium text-muted-foreground">Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="mt-2 bg-gray-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4">
                          <FormLabel className="text-sm font-medium text-muted-foreground">Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="mt-2 bg-gray-50/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Email</dt>
                  <dd className="mt-2 text-lg">{user.email}</dd>
                </div>
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Phone</dt>
                  <dd className="mt-2 text-lg">{user.phone || "Not provided"}</dd>
                </div>
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Address</dt>
                  <dd className="mt-2 text-lg">{user.address || "Not provided"}</dd>
                </div>
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Username</dt>
                  <dd className="mt-2 text-lg">{user.username}</dd>
                </div>
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Email Verification</dt>
                  <dd className="mt-2 flex items-center gap-3">
                    {user.isEmailVerified ? (
                      <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm">Verified</span>
                    ) : (
                      <>
                        <span className="text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full text-sm">Pending verification</span>
                        {!verificationEmailSent ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendVerificationEmailMutation.mutate()}
                            disabled={sendVerificationEmailMutation.isPending}
                            className="text-xs h-7 border-primary/20 hover:bg-primary/5 text-primary"
                          >
                            {sendVerificationEmailMutation.isPending ? "Sending..." : "Send Verification Email"}
                          </Button>
                        ) : verificationLink ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-amber-600 text-xs">Email service unavailable. Use this link instead:</span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={verificationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary underline truncate max-w-[200px]"
                              >
                                Click to verify your email
                              </a>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(verificationLink);
                                  toast({
                                    title: "Link Copied",
                                    description: "Verification link copied to clipboard"
                                  });
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs">Verification email sent!</span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
                <div className="border-b pb-4">
                  <dt className="text-muted-foreground font-medium text-sm">Account Status</dt>
                  <dd className="mt-2">
                    <span className="bg-primary-50 text-primary px-3 py-1 rounded-full text-sm font-medium capitalize">{user.status}</span>
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}