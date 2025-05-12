import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  // Safe handling for undefined/null password values
  const passwordValue = password || "";
  
  console.log("PasswordStrengthMeter rendering with password length:", passwordValue.length);
  
  // Define validation rules
  const rules = [
    { 
      id: "length", 
      label: "At least 8 characters", 
      isValid: (pwd: string) => pwd.length >= 8 
    },
    { 
      id: "uppercase", 
      label: "At least one uppercase letter", 
      isValid: (pwd: string) => /[A-Z]/.test(pwd) 
    },
    { 
      id: "lowercase", 
      label: "At least one lowercase letter", 
      isValid: (pwd: string) => /[a-z]/.test(pwd) 
    },
    { 
      id: "number", 
      label: "At least one number", 
      isValid: (pwd: string) => /[0-9]/.test(pwd) 
    },
    { 
      id: "special", 
      label: "At least one special character", 
      isValid: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) 
    }
  ];

  // Check if all criteria are met
  const allRulesMet = rules.every(rule => rule.isValid(passwordValue));
  
  try {
    return (
      <div className={`bg-gray-50 p-3 rounded-md border ${allRulesMet ? 'border-green-200' : 'border-gray-200'} mt-2 mb-4 text-sm`}>
        <p className="font-medium text-gray-700 mb-2">Password Requirements:</p>
        <ul className="space-y-1">
          {rules.map(rule => (
            <li key={rule.id} className="flex items-center gap-2">
              {rule.isValid(passwordValue) ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={rule.isValid(passwordValue) ? "text-green-700" : "text-gray-500"}>
                {rule.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    console.error("Error rendering PasswordStrengthMeter:", error);
    // Fallback rendering in case of error
    return (
      <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2 mb-4 text-sm">
        <p className="font-medium text-gray-700">Password Requirements:</p>
        <p className="text-sm text-gray-500">
          Password must be at least 8 characters and include uppercase, lowercase, 
          number, and special character.
        </p>
      </div>
    );
  }
}

export function isStrongPassword(password: string): boolean {
  // Handle undefined/null passwords
  if (!password) return false;
  
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}