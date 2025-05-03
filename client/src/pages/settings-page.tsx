import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  KeyRound,
  Mail,
  Bell,
  Shield,
  Clock,
  Smartphone,
  LogOut,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  BarChart,
  Utensils,
  Heart,
  CalendarClock,
} from "lucide-react";

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  profileImage: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  sessionReminders: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  announcementAlerts: z.boolean().default(true),
  fitnessUpdates: z.boolean().default(false),
  mealPlanUpdates: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isUpdating, setIsUpdating] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      profileImage: user?.profileImage || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      sessionReminders: true,
      paymentReminders: true,
      announcementAlerts: true,
      fitnessUpdates: false,
      mealPlanUpdates: false,
    },
  });

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      setIsUpdating(true);
      // Only send what's changed
      const updateData = Object.fromEntries(
        Object.entries(data).filter(
          ([key, value]) => value !== (user as any)?.[key]
        )
      );
      
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes detected",
          description: "You haven't made any changes to your profile.",
        });
        setIsUpdating(false);
        return;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, updateData);
      const updatedUser = await res.json();
      
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      setIsUpdating(true);
      
      await apiRequest("POST", "/api/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update password",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function onNotificationsSubmit(data: NotificationFormValues) {
    try {
      setIsUpdating(true);
      
      await apiRequest("PATCH", `/api/users/${user?.id}/notifications`, data);
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Failed to update notification preferences",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 heading">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="w-full h-full flex md:flex-row flex-col"
          >
            {/* Sidebar */}
            <Card className="md:sticky md:top-4 h-fit md:w-auto w-full">
              <CardContent className="p-0">
                <TabsList className="flex flex-col h-full items-stretch justify-start bg-transparent p-0 border-r border-gray-200">
                  <TabsTrigger
                    value="profile"
                    className="justify-start rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-gray-50"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="justify-start rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-gray-50"
                  >
                    <KeyRound className="h-5 w-5 mr-2" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="justify-start rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-gray-50"
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <Button
                    variant="ghost"
                    className="justify-start p-3 rounded-none text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </Button>
                </TabsList>
              </CardContent>
            </Card>

            {/* Content Area */}
            <div className="space-y-6 w-full">
            <TabsContent value="profile" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl heading">Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-6"
                    >
                      <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="w-full max-w-[120px] mx-auto md:mx-0">
                          <Avatar className="h-24 w-24 mx-auto">
                            <AvatarImage 
                              src={user?.profileImage || undefined} 
                              alt={user?.fullName || "User"} 
                            />
                            <AvatarFallback className="text-2xl">
                              {user?.fullName ? getInitials(user.fullName) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-center mt-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              Change Photo
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="your.email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(123) 456-7890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your address" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl heading">Account Information</CardTitle>
                  <CardDescription>
                    View your account details and role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-gray-500">Username</span>
                        <span className="font-medium">{user?.username || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-gray-500">Account Role</span>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-primary mr-1" />
                          <span className="font-medium capitalize">{user?.role || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-gray-500">Account Created</span>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="font-medium">
                            {user?.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString() 
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-gray-500">Last Update</span>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="font-medium">
                            {user?.updatedAt 
                              ? new Date(user.updatedAt).toLocaleDateString() 
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl heading">Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters long.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl heading">Notification Preferences</CardTitle>
                  <CardDescription>
                    Customize how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form
                      onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Mail className="h-5 w-5 mr-2 text-primary" />
                                  Email Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="sessionReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Calendar className="h-5 w-5 mr-2 text-secondary" />
                                  Session Reminders
                                </FormLabel>
                                <FormDescription>
                                  Receive reminders about upcoming practice sessions
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="paymentReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <DollarSign className="h-5 w-5 mr-2 text-danger" />
                                  Payment Reminders
                                </FormLabel>
                                <FormDescription>
                                  Receive reminders about upcoming or overdue payments
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="announcementAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Bell className="h-5 w-5 mr-2 text-accent" />
                                  Announcement Alerts
                                </FormLabel>
                                <FormDescription>
                                  Receive notifications about new announcements
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="fitnessUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Heart className="h-5 w-5 mr-2 text-success" />
                                  Fitness Updates
                                </FormLabel>
                                <FormDescription>
                                  Receive updates about fitness progress
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="mealPlanUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Utensils className="h-5 w-5 mr-2 text-info" />
                                  Meal Plan Updates
                                </FormLabel>
                                <FormDescription>
                                  Receive updates when meal plans are modified
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Preferences
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
