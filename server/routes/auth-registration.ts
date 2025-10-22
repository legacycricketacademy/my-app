import { Router, Request, Response } from "express";
import { db } from "../../db/index.js";
import { users, academies } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { sendEmail } from "../utils/email.js";

const router = Router();

// Registration validation schema
const registrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().optional(),
  role: z.enum(["parent", "coach", "admin"]),
  childName: z.string().optional(),
  ageGroup: z.string().optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = registrationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        ok: false,
        error: "validation_failed",
        message: "Please check your input",
        details: errors
      });
    }

    const data: RegistrationData = validationResult.data;

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email)
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "email_exists",
        message: "An account with this email already exists. Please log in instead."
      });
    }

    // Get or create default academy
    let defaultAcademy = await db.query.academies.findFirst({
      where: eq(academies.name, "Legacy Cricket Academy")
    });

    if (!defaultAcademy) {
      const [academy] = await db.insert(academies).values({
        name: "Legacy Cricket Academy",
        slug: "legacy-cricket-academy",
        description: "The main cricket academy for player development",
        address: "123 Cricket Lane, Sports City",
        phone: "+1234567890",
        email: "info@legacycricket.com",
        subscriptionTier: "pro",
        maxPlayers: 200,
        maxCoaches: 10,
        status: "active",
      }).returning();
      defaultAcademy = academy;
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.password, salt);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // 24 hours

    // Create username from email
    const username = data.email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Determine initial status based on role
    // Coaches and admins need approval, parents are active after email verification
    const initialStatus = data.role === "parent" ? "pending_verification" : "pending";

    // Create user
    const [newUser] = await db.insert(users).values({
      academyId: defaultAcademy.id,
      username,
      password: hashedPassword,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      status: initialStatus,
      isActive: false, // Will be activated after email verification
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      emailStatus: "pending",
      phone: data.phone || null,
    }).returning();

    console.log(`✅ User registered: ${newUser.email} (${newUser.role}) - ID: ${newUser.id}`);

    // Send verification email
    try {
      const baseUrl = process.env.PUBLIC_BASE_URL || process.env.CORS_ORIGIN || "http://localhost:3002";
      const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;

      const emailSent = await sendEmail(
        data.email,
        "Welcome to Legacy Cricket Academy - Verify Your Email",
        `Hi ${data.fullName}!\n\nWelcome to Legacy Cricket Academy! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.\n\n- Legacy Cricket Academy Team`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1>🏏 Legacy Cricket Academy</h1>
            </div>
            <div style="padding: 20px; background: #f8fafc;">
              <h2>Welcome, ${data.fullName}!</h2>
              <p>Thank you for registering with Legacy Cricket Academy. Please verify your email address to activate your account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
              <p style="color: #666; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        `
      );

      if (emailSent) {
        await db.update(users)
          .set({ emailStatus: "sent", lastEmailAttempt: new Date() })
          .where(eq(users.id, newUser.id));
      } else {
        await db.update(users)
          .set({ 
            emailStatus: "failed", 
            emailFailureReason: "Failed to send verification email",
            lastEmailAttempt: new Date() 
          })
          .where(eq(users.id, newUser.id));
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      await db.update(users)
        .set({ 
          emailStatus: "failed", 
          emailFailureReason: emailError instanceof Error ? emailError.message : "Unknown error",
          lastEmailAttempt: new Date() 
        })
        .where(eq(users.id, newUser.id));
    }

    // Send admin notification if role is coach or admin
    if (data.role === "coach" || data.role === "admin") {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.DEFAULT_FROM_EMAIL;
      if (adminEmail) {
        try {
          await sendEmail(
            adminEmail,
            `New ${data.role} registration - Approval Required`,
            `A new ${data.role} has registered and requires approval:\n\nName: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone || "Not provided"}\n\nPlease log in to the admin dashboard to review and approve this registration.`,
            `
              <div style="font-family: Arial, sans-serif;">
                <h2>New ${data.role} Registration</h2>
                <p>A new ${data.role} has registered and requires approval:</p>
                <ul>
                  <li><strong>Name:</strong> ${data.fullName}</li>
                  <li><strong>Email:</strong> ${data.email}</li>
                  <li><strong>Phone:</strong> ${data.phone || "Not provided"}</li>
                  <li><strong>Role:</strong> ${data.role}</li>
                </ul>
                <p>Please log in to the admin dashboard to review and approve this registration.</p>
              </div>
            `
          );
        } catch (error) {
          console.error("Failed to send admin notification:", error);
        }
      }
    }

    // Return success response
    return res.status(201).json({
      ok: true,
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "An error occurred during registration. Please try again."
    });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify email address with token
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        ok: false,
        error: "invalid_token",
        message: "Invalid verification token"
      });
    }

    // Find user with this token
    const user = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, token)
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "token_not_found",
        message: "Verification token not found or already used"
      });
    }

    // Check if token expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return res.status(410).json({
        ok: false,
        error: "token_expired",
        message: "Verification link has expired. Please request a new one."
      });
    }

    // Update user
    await db.update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        status: user.role === "parent" ? "active" : "pending", // Parents become active, others wait for admin approval
        isActive: user.role === "parent", // Parents are active after verification
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Email verified for user: ${user.email}`);

    const message = user.role === "parent" 
      ? "Email verified successfully! Your account is now active. You can log in now."
      : "Email verified successfully! Your account is pending admin approval. You'll receive an email once approved.";

    return res.status(200).json({
      ok: true,
      message,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.role === "parent" ? "active" : "pending"
      }
    });

  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "An error occurred during verification"
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email is required"
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        ok: true,
        message: "If an account with this email exists, a verification email has been sent."
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        ok: false,
        error: "already_verified",
        message: "This email address is already verified"
      });
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

    await db.update(users)
      .set({
        emailVerificationToken,
        emailVerificationExpires,
        emailStatus: "pending"
      })
      .where(eq(users.id, user.id));

    // Send email
    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.CORS_ORIGIN || "http://localhost:3002";
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;

    await sendEmail(
      user.email,
      "Legacy Cricket Academy - Verify Your Email",
      `Hi ${user.fullName}!\n\nPlease verify your email address:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>🏏 Legacy Cricket Academy</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <h2>Verify Your Email</h2>
            <p>Hi ${user.fullName},</p>
            <p>Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>This link will expire in 24 hours.</p>
          </div>
        </div>
      `
    );

    return res.status(200).json({
      ok: true,
      message: "Verification email sent"
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to resend verification email"
    });
  }
});

export default router;
