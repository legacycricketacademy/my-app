import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  // Define validation rules
  const rules = [
    { 
      id: "length", 
      label: "At least 8 characters", 
      isValid: (password: string) => password.length >= 8 
    },
    { 
      id: "uppercase", 
      label: "At least one uppercase letter", 
      isValid: (password: string) => /[A-Z]/.test(password) 
    },
    { 
      id: "lowercase", 
      label: "At least one lowercase letter", 
      isValid: (password: string) => /[a-z]/.test(password) 
    },
    { 
      id: "number", 
      label: "At least one number", 
      isValid: (password: string) => /[0-9]/.test(password) 
    },
    { 
      id: "special", 
      label: "At least one special character", 
      isValid: (password: string) => /[^A-Za-z0-9]/.test(password) 
    }
  ];

  // Check if all criteria are met
  const allRulesMet = rules.every(rule => rule.isValid(password));
  
  return (
    <div className={`bg-gray-50 p-3 rounded-md border ${allRulesMet ? 'border-green-200' : 'border-gray-200'} mt-2 mb-4 text-sm`}>
      <p className="font-medium text-gray-700 mb-2">Password Requirements:</p>
      <ul className="space-y-1">
        {rules.map(rule => (
          <li key={rule.id} className="flex items-center gap-2">
            {rule.isValid(password) ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            <span className={rule.isValid(password) ? "text-green-700" : "text-gray-500"}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}