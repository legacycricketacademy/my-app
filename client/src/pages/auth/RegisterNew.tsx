import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { fetchJson } from "@/lib/api";

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: "parent" | "coach" | "admin";
  childName?: string;
  ageGroup?: string;
};

type ValidationError = {
  field: string;
  message: string;
};

export default function RegisterNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "parent",
    childName: "",
    ageGroup: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; message: string }>({
    score: 0,
    message: ""
  });

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let message = "";

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) message = "Weak";
    else if (score <= 4) message = "Medium";
    else message = "Strong";

    return { score, message };
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    if (!formData.fullName.trim()) {
      errors.push({ field: "fullName", message: "Name is required" });
    } else if (formData.fullName.trim().length < 2) {
      errors.push({ field: "fullName", message: "Name must be at least 2 characters" });
    }

    if (!formData.email.trim()) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push({ field: "email", message: "Invalid email address" });
    }

    if (!formData.password) {
      errors.push({ field: "password", message: "Password is required" });
    } else {
      if (formData.password.length < 8) {
        errors.push({ field: "password", message: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(formData.password)) {
        errors.push({ field: "password", message: "Password must contain an uppercase letter" });
      }
      if (!/[a-z]/.test(formData.password)) {
        errors.push({ field: "password", message: "Password must contain a lowercase letter" });
      }
      if (!/[0-9]/.test(formData.password)) {
        errors.push({ field: "password", message: "Password must contain a number" });
      }
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetchJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          childName: formData.childName?.trim() || undefined,
          ageGroup: formData.ageGroup || undefined,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      if (err.message.includes("email_exists")) {
        setError("An account with this email already exists. Please log in instead.");
      } else if (err.message.includes("validation_failed")) {
        setError("Please check your input and try again.");
      } else {
        setError("Registration failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Registration Successful!</CardTitle>
            <CardDescription className="text-center">
              Please check your email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please click the link to activate your account.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getFieldError = (field: string) => {
    return validationErrors.find(err => err.field === field)?.message;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-2">
            <span className="text-4xl">🏏</span>
          </div>
          <CardTitle className="text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Legacy Cricket Academy
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "parent" | "coach" | "admin") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role" data-testid="reg-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                data-testid="reg-full-name"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={getFieldError("fullName") ? "border-red-500" : ""}
              />
              {getFieldError("fullName") && (
                <p className="text-sm text-red-500">{getFieldError("fullName")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                data-testid="reg-email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={getFieldError("email") ? "border-red-500" : ""}
              />
              {getFieldError("email") && (
                <p className="text-sm text-red-500">{getFieldError("email")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                data-testid="reg-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={getFieldError("password") ? "border-red-500" : ""}
              />
              {formData.password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.score <= 2
                          ? "bg-red-500 w-1/3"
                          : passwordStrength.score <= 4
                          ? "bg-yellow-500 w-2/3"
                          : "bg-green-500 w-full"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{passwordStrength.message}</span>
                </div>
              )}
              {getFieldError("password") && (
                <p className="text-sm text-red-500">{getFieldError("password")}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                data-testid="reg-confirm-password"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={getFieldError("confirmPassword") ? "border-red-500" : ""}
              />
              {getFieldError("confirmPassword") && (
                <p className="text-sm text-red-500">{getFieldError("confirmPassword")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="reg-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {formData.role === "parent" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="childName">Child's Name (Optional)</Label>
                  <Input
                    id="childName"
                    data-testid="reg-child-name"
                    placeholder="Jane Doe"
                    value={formData.childName}
                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Age Group (Optional)</Label>
                  <Select
                    value={formData.ageGroup}
                    onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                  >
                    <SelectTrigger id="ageGroup" data-testid="reg-age-group">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-8 years">5-8 years</SelectItem>
                      <SelectItem value="8+ years">8+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(formData.role === "coach" || formData.role === "admin") && (
              <Alert>
                <AlertDescription>
                  {formData.role === "coach" ? "Coach" : "Administrator"} accounts require admin approval. 
                  You'll receive an email once your account is approved.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              data-testid="reg-submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/auth")}
              >
                Log in
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
