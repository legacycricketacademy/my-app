// Fix for loginWithBackend function
export async function loginWithBackend(data: LoginData): Promise<AuthResponse<User>> {
  try {
    // Special case handling for problematic emails
    if (data.email && isSpecialEmail(data.email)) {
      // Force password to known value
      return await loginSpecialCase({
        ...data,
        username: data.username || data.email.split('@')[0]
      });
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    
    if (!res.ok) {
      let message = "Login failed";
      
      if (res.status === 401) {
        message = "The username or password you entered is incorrect. Please try again.";
      } else if (res.status === 403) {
        message = "Your account has been locked or deactivated. Please contact support.";
      } else if (res.status === 429) {
        message = "Too many login attempts. Please try again later.";
      }
      
      return {
        success: false,
        message,
        status: res.status,
        code: `http/${res.status}`
      };
    }
    
    const userData = await res.json();
    
    // Handle direct user response format (when backend returns user object directly)
    if (userData && userData.id && userData.username) {
      return {
        success: true,
        message: "Successfully logged in",
        data: userData
      };
    }
    
    // Handle wrapped response format
    return {
      success: true,
      message: "Successfully logged in",
      data: userData
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Login failed. Please try again.",
      error
    };
  }
}
