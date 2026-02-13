import { FastifyInstance } from "fastify";
import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import redis from "../redis";
import { generateAccessToken, hashToken } from "../utils/token";
import { logAudit } from "../utils/audit";
import { checkIPLockout, recordFailedAttempt, resetIPAttempts } from "../utils/ipLockout";
import { sendOTPEmail, sendPasswordResetEmail } from "../utils/email";
import { env } from "../config/env";

export async function authRoutes(app: FastifyInstance) {

  // =========================
  // EMAIL/PASSWORD SIGNUP
  // =========================
  app.post("/auth/signup", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { email, password, name } = request.body;
    const ipAddress = request.ip;

    const lockout = await checkIPLockout(ipAddress);
    if (lockout.locked) {
      return reply.status(429).send({
        success: false,
        message: `Too many attempts. Try again in ${lockout.minutesLeft} minutes.`
      });
    }

    if (!email || !password || !name) {
      return reply.status(400).send({ success: false, message: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return reply.status(400).send({ success: false, message: "Password must be at least 6 characters" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ success: false, message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 10000);

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          username,
          otp,
          otpExpiry,
          isVerified: false,
        },
      });

      await sendOTPEmail(email, otp);
      await logAudit("SIGNUP_INITIATED", request, undefined, { email });

      return reply.send({
        success: true,
        message: "Signup successful. Please verify your email with the OTP sent.",
        email
      });
    } catch (error) {
      console.error("Signup error:", error);
      await recordFailedAttempt(ipAddress);
      return reply.status(500).send({ success: false, message: "Signup failed" });
    }
  });

  // =========================
  // VERIFY OTP
  // =========================
  app.post("/auth/verify-otp", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { email, otp } = request.body;
    const ipAddress = request.ip;

    if (!email || !otp) {
      return reply.status(400).send({ success: false, message: "Email and OTP are required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        await recordFailedAttempt(ipAddress);
        return reply.status(404).send({ success: false, message: "User not found" });
      }

      if (!user.otp || !user.otpExpiry) {
        return reply.status(400).send({ success: false, message: "No OTP found. Please request a new one." });
      }

      if (user.otpExpiry < new Date()) {
        return reply.status(400).send({ success: false, message: "OTP expired. Please request a new one." });
      }

      if (user.otp !== otp) {
        await recordFailedAttempt(ipAddress);
        return reply.status(400).send({ success: false, message: "Invalid OTP" });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          otp: null,
          otpExpiry: null,
        },
      });

      // Generate session
      const sessionToken = crypto.randomBytes(64).toString("hex");
      const hashedSession = hashToken(sessionToken);
      const userAgent = request.headers["user-agent"] || "unknown";
      const deviceName = userAgent.includes("Mobile") ? "Mobile Device" : "Desktop";

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: hashedSession,
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      });

      reply.setCookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      await resetIPAttempts(ipAddress);
      await logAudit("OTP_VERIFIED", request, user.id);

      if (!user.profileCompleted) {
        return reply.send({ success: true, token: accessToken, setupRequired: true });
      }

      return reply.send({ success: true, token: accessToken });
    } catch (error) {
      console.error("OTP verification error:", error);
      return reply.status(500).send({ success: false, message: "Verification failed" });
    }
  });

  // =========================
  // RESEND OTP
  // =========================
  app.post("/auth/resend-otp", {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ success: false, message: "Email is required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return reply.status(404).send({ success: false, message: "User not found" });
      }

      if (user.isVerified) {
        return reply.status(400).send({ success: false, message: "Email already verified" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiry },
      });

      await sendOTPEmail(email, otp);
      await logAudit("OTP_RESENT", request, user.id);

      return reply.send({ success: true, message: "OTP resent successfully" });
    } catch (error) {
      console.error("Resend OTP error:", error);
      return reply.status(500).send({ success: false, message: "Failed to resend OTP" });
    }
  });

  // =========================
  // EMAIL/PASSWORD LOGIN
  // =========================
  app.post("/auth/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { email, password } = request.body;
    const ipAddress = request.ip;

    const lockout = await checkIPLockout(ipAddress);
    if (lockout.locked) {
      return reply.status(429).send({
        success: false,
        message: `Too many attempts. Try again in ${lockout.minutesLeft} minutes.`
      });
    }

    if (!email || !password) {
      return reply.status(400).send({ success: false, message: "Email and password are required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.password) {
        await recordFailedAttempt(ipAddress);
        return reply.status(401).send({ success: false, message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        await recordFailedAttempt(ipAddress);
        return reply.status(401).send({ success: false, message: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return reply.status(403).send({ success: false, message: "Please verify your email first", requiresVerification: true });
      }

      if (!user.isActive) {
        return reply.status(403).send({ success: false, message: "Account is inactive" });
      }

      // Generate session
      const sessionToken = crypto.randomBytes(64).toString("hex");
      const hashedSession = hashToken(sessionToken);
      const userAgent = request.headers["user-agent"] || "unknown";
      const deviceName = userAgent.includes("Mobile") ? "Mobile Device" : "Desktop";

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: hashedSession,
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      });

      reply.setCookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      await resetIPAttempts(ipAddress);
      await logAudit("LOGIN_SUCCESS", request, user.id, { method: "email_password" });

      return reply.send({ success: true, token: accessToken });
    } catch (error) {
      console.error("Login error:", error);
      await recordFailedAttempt(ipAddress);
      return reply.status(500).send({ success: false, message: "Login failed" });
    }
  });

  // =========================
  // FORGOT PASSWORD
  // =========================
  app.post("/auth/forgot-password", {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ success: false, message: "Email is required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // Don't reveal if user exists
      if (!user) {
        return reply.send({ success: true, message: "If the email exists, a reset link has been sent" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      await sendPasswordResetEmail(email, resetToken);
      await logAudit("PASSWORD_RESET_REQUESTED", request, user.id);

      return reply.send({ success: true, message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return reply.status(500).send({ success: false, message: "Failed to process request" });
    }
  });

  // =========================
  // RESET PASSWORD
  // =========================
  app.post("/auth/reset-password", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: any, reply) => {
    const { token, password } = request.body;

    if (!token || !password) {
      return reply.status(400).send({ success: false, message: "Token and password are required" });
    }

    if (password.length < 6) {
      return reply.status(400).send({ success: false, message: "Password must be at least 6 characters" });
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gte: new Date() },
        },
      });

      if (!user) {
        return reply.status(400).send({ success: false, message: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          tokenVersion: user.tokenVersion + 1, // Invalidate all existing sessions
        },
      });

      // Delete all sessions
      await prisma.session.deleteMany({ where: { userId: user.id } });

      await logAudit("PASSWORD_RESET_SUCCESS", request, user.id);

      return reply.send({ success: true, message: "Password reset successful. Please login with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      return reply.status(500).send({ success: false, message: "Failed to reset password" });
    }
  });

  // =========================
  // GOOGLE OAUTH CALLBACK
  // =========================
  app.get("/auth/google/callback", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const ipAddress = request.ip;

    // Check IP lockout
    const lockout = await checkIPLockout(ipAddress);
    if (lockout.locked) {
      await logAudit("OAUTH_BLOCKED_IP_LOCKED", request);
      return reply.status(429).send({
        success: false,
        message: `Too many attempts. Try again in ${lockout.minutesLeft} minutes.`
      });
    }

    try {
      const { token } = await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      
      const googleUser: any = await userInfoResponse.json();

      let user = await prisma.user.findUnique({ where: { googleId: googleUser.id } });

      if (!user) {
        const username = googleUser.email.split("@")[0] + "_" + Math.floor(Math.random() * 10000);
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            username,
            name: googleUser.name,
            googleId: googleUser.id,
            avatarUrl: googleUser.picture,
          },
        });

        await logAudit("USER_CREATED", request, user.id, { method: "google_oauth" });
      }

      if (!user.isActive) {
        await logAudit("LOGIN_FAILED_INACTIVE", request, user.id);
        return reply.status(403).send({
          success: false,
          message: "Account is inactive. Contact support."
        });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(64).toString("hex");
      const hashedSession = hashToken(sessionToken);

      // Store session in database
      const userAgent = request.headers["user-agent"] || "unknown";
      const deviceName = userAgent.includes("Mobile") ? "Mobile Device" : "Desktop";

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: hashedSession,
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Store session in Redis (fast lookup)
      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));

      // Generate JWT
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      });

      // Set session cookie
      reply.setCookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      // Reset IP attempts on successful login
      await resetIPAttempts(ipAddress);

      await logAudit("LOGIN_SUCCESS", request, user.id, { method: "google_oauth" });

      // Check if profile is completed
      if (!user.profileCompleted) {
        return reply.redirect(`${env.FRONTEND_URL}/complete-profile?token=${accessToken}`);
      }

      return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error("Google OAuth error:", error);
      await recordFailedAttempt(ipAddress);
      await logAudit("OAUTH_ERROR", request, undefined, { error: String(error) });
      return reply.redirect(`${env.FRONTEND_URL}/?error=auth_failed`);
    }
  });

  // =========================
  // REFRESH TOKEN (SESSION ROTATION)
  // =========================
  app.post("/auth/refresh", {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const sessionToken = request.cookies.sessionToken;

    if (!sessionToken) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const hashedSession = hashToken(sessionToken);

    // Check Redis first (fast)
    const cachedSession = await redis.get(`session:${hashedSession}`);

    if (!cachedSession) {
      // Check database
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: hashedSession },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) {
        await logAudit("REFRESH_FAILED_INVALID", request);
        return reply.status(401).send({ success: false, message: "Invalid session" });
      }

      // Restore to Redis
      const user = await prisma.user.findUnique({ where: { id: dbSession.userId } });
      if (!user) {
        return reply.status(401).send({ success: false, message: "User not found" });
      }

      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));
    }

    const sessionData = JSON.parse(cachedSession || "{}");

    // Generate new JWT
    const accessToken = generateAccessToken({
      userId: sessionData.userId,
      email: sessionData.email,
      username: sessionData.username,
      tokenVersion: sessionData.tokenVersion,
    });

    // Update last active
    await prisma.session.update({
      where: { sessionToken: hashedSession },
      data: { lastActive: new Date() },
    });

    await logAudit("TOKEN_REFRESHED", request, sessionData.userId);

    return reply.send({ success: true, token: accessToken });
  });

  // =========================
  // LOGOUT
  // =========================
  app.post("/auth/logout", async (request, reply) => {
    const sessionToken = request.cookies.sessionToken;

    if (sessionToken) {
      const hashedSession = hashToken(sessionToken);

      // Delete from Redis
      await redis.del(`session:${hashedSession}`);

      // Delete from database
      await prisma.session.deleteMany({ where: { sessionToken: hashedSession } });

      const authHeader = request.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
          const jwt = require("jsonwebtoken");
          const decoded: any = jwt.verify(token, env.JWT_SECRET);
          await logAudit("LOGOUT", request, decoded.userId);
        } catch {}
      }
    }

    reply.clearCookie("sessionToken", { path: "/" });
    return reply.send({ success: true, message: "Logged out successfully" });
  });

  // =========================
  // GET CURRENT USER
  // =========================
  app.get("/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          displayName: true,
          bio: true,
          role: true,
          skills: true,
          avatarUrl: true,
          isActive: true,
          profileCompleted: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ success: false, message: "User not found" });
      }

      if (!user.isActive) {
        return reply.status(403).send({ success: false, message: "Account inactive" });
      }

      // Verify tokenVersion
      if (decoded.tokenVersion !== (await prisma.user.findUnique({ where: { id: user.id }, select: { tokenVersion: true } }))?.tokenVersion) {
        return reply.status(401).send({ success: false, message: "Token invalidated" });
      }

      return reply.send({ success: true, user });
    } catch (error) {
      return reply.status(401).send({ success: false, message: "Invalid token" });
    }
  });

  // =========================
  // GET USER SESSIONS (DEVICE MANAGEMENT)
  // =========================
  app.get("/auth/sessions", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, env.JWT_SECRET);

      const sessions = await prisma.session.findMany({
        where: { userId: decoded.userId },
        select: {
          id: true,
          deviceName: true,
          ipAddress: true,
          lastActive: true,
          createdAt: true,
        },
        orderBy: { lastActive: "desc" },
      });

      return reply.send({ success: true, sessions });
    } catch (error) {
      return reply.status(401).send({ success: false, message: "Invalid token" });
    }
  });

  // =========================
  // REVOKE SESSION (DEVICE MANAGEMENT)
  // =========================
  app.delete("/auth/sessions/:sessionId", async (request: any, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, env.JWT_SECRET);

      const session = await prisma.session.findUnique({
        where: { id: request.params.sessionId },
      });

      if (!session || session.userId !== decoded.userId) {
        return reply.status(404).send({ success: false, message: "Session not found" });
      }

      // Delete from Redis
      await redis.del(`session:${session.sessionToken}`);

      // Delete from database
      await prisma.session.delete({ where: { id: session.id } });

      await logAudit("SESSION_REVOKED", request, decoded.userId, { sessionId: session.id });

      return reply.send({ success: true, message: "Session revoked" });
    } catch (error) {
      return reply.status(401).send({ success: false, message: "Invalid token" });
    }
  });

  // =========================
  // GITHUB OAUTH CALLBACK
  // =========================
  app.get("/auth/github/callback", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const ipAddress = request.ip;

    const lockout = await checkIPLockout(ipAddress);
    if (lockout.locked) {
      await logAudit("OAUTH_BLOCKED_IP_LOCKED", request);
      return reply.status(429).send({
        success: false,
        message: `Too many attempts. Try again in ${lockout.minutesLeft} minutes.`
      });
    }

    try {
      const { token } = await (app as any).githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      const userInfoResponse = await fetch("https://api.github.com/user", {
        headers: { 
          Authorization: `Bearer ${token.access_token}`,
          "User-Agent": "ScribbleX"
        },
      });
      
      const githubUser: any = await userInfoResponse.json();

      // Get email if not public
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await fetch("https://api.github.com/user/emails", {
          headers: { 
            Authorization: `Bearer ${token.access_token}`,
            "User-Agent": "ScribbleX"
          },
        });
        const emails: any = await emailResponse.json();
        email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
      }

      let user = await prisma.user.findUnique({ where: { githubId: githubUser.id.toString() } });

      if (!user) {
        const username = githubUser.login + "_" + Math.floor(Math.random() * 10000);
        user = await prisma.user.create({
          data: {
            email: email || `${githubUser.login}@github.user`,
            username,
            name: githubUser.name || githubUser.login,
            githubId: githubUser.id.toString(),
            avatarUrl: githubUser.avatar_url,
            isVerified: true,
          },
        });

        await logAudit("USER_CREATED", request, user.id, { method: "github_oauth" });
      }

      if (!user.isActive) {
        await logAudit("LOGIN_FAILED_INACTIVE", request, user.id);
        return reply.status(403).send({
          success: false,
          message: "Account is inactive. Contact support."
        });
      }

      const sessionToken = crypto.randomBytes(64).toString("hex");
      const hashedSession = hashToken(sessionToken);
      const userAgent = request.headers["user-agent"] || "unknown";
      const deviceName = userAgent.includes("Mobile") ? "Mobile Device" : "Desktop";

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: hashedSession,
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      });

      reply.setCookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      await resetIPAttempts(ipAddress);
      await logAudit("LOGIN_SUCCESS", request, user.id, { method: "github_oauth" });

      if (!user.profileCompleted) {
        return reply.redirect(`${env.FRONTEND_URL}/complete-profile?token=${accessToken}`);
      }

      return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      await recordFailedAttempt(ipAddress);
      await logAudit("OAUTH_ERROR", request, undefined, { error: String(error) });
      return reply.redirect(`${env.FRONTEND_URL}/?error=auth_failed`);
    }
  });

  // =========================
  // APPLE OAUTH CALLBACK
  // =========================
  app.get("/auth/apple/callback", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const ipAddress = request.ip;

    const lockout = await checkIPLockout(ipAddress);
    if (lockout.locked) {
      await logAudit("OAUTH_BLOCKED_IP_LOCKED", request);
      return reply.status(429).send({
        success: false,
        message: `Too many attempts. Try again in ${lockout.minutesLeft} minutes.`
      });
    }

    try {
      const { token } = await (app as any).appleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // Decode Apple ID token
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.decode(token.id_token);
      
      const appleUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || "Apple User",
      };

      let user = await prisma.user.findUnique({ where: { appleId: appleUser.id } });

      if (!user) {
        const username = appleUser.email.split("@")[0] + "_" + Math.floor(Math.random() * 10000);
        user = await prisma.user.create({
          data: {
            email: appleUser.email,
            username,
            name: appleUser.name,
            appleId: appleUser.id,
            isVerified: true,
          },
        });

        await logAudit("USER_CREATED", request, user.id, { method: "apple_oauth" });
      }

      if (!user.isActive) {
        await logAudit("LOGIN_FAILED_INACTIVE", request, user.id);
        return reply.status(403).send({
          success: false,
          message: "Account is inactive. Contact support."
        });
      }

      const sessionToken = crypto.randomBytes(64).toString("hex");
      const hashedSession = hashToken(sessionToken);
      const userAgent = request.headers["user-agent"] || "unknown";
      const deviceName = userAgent.includes("Mobile") ? "Mobile Device" : "Desktop";

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: hashedSession,
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await redis.setex(`session:${hashedSession}`, 604800, JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      }));

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        tokenVersion: user.tokenVersion,
      });

      reply.setCookie("sessionToken", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      await resetIPAttempts(ipAddress);
      await logAudit("LOGIN_SUCCESS", request, user.id, { method: "apple_oauth" });

      if (!user.profileCompleted) {
        return reply.redirect(`${env.FRONTEND_URL}/complete-profile?token=${accessToken}`);
      }

      return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error("Apple OAuth error:", error);
      await recordFailedAttempt(ipAddress);
      await logAudit("OAUTH_ERROR", request, undefined, { error: String(error) });
      return reply.redirect(`${env.FRONTEND_URL}/?error=auth_failed`);
    }
  });

}
