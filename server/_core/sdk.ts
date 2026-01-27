import { COOKIE_NAME } from "@shared/const";
import type { Request } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { auth } from "../firestore";
import type { User } from "../schema";

// Simple Error class if @shared/_core/errors is not found or complex
class AuthError extends Error {
  constructor(public message: string, public code: number = 401) {
    super(message);
  }
}

class SDKServer {

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return {};
    }
    return parseCookieHeader(cookieHeader);
  }

  /**
   * Authenticates the request using Firebase Auth ID Token.
   * Expects 'Authorization: Bearer <token>' or cookie.
   */
  async authenticateRequest(req: Request): Promise<User> {
    let token: string | undefined | null = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      const cookies = this.parseCookies(req.headers.cookie);
      token = cookies[COOKIE_NAME];
    }

    if (!token) {
      throw new AuthError("No authentication token found", 401);
    }

    try {
      // Verify Firebase ID Token
      const decodedToken = await auth.verifyIdToken(token);

      const openId = decodedToken.uid;
      let user = await db.getUserByOpenId(openId);

      if (user) {
        // Update access time
        await db.upsertUser({
          openId,
          lastSignedIn: new Date()
        });
        // Refresh user data if needed? For now just return from DB
      } else {
        // First time login, create user
        console.log(`[Auth] Creating new user for ${decodedToken.email}`);
        await db.upsertUser({
          openId,
          email: decodedToken.email || null,
          name: decodedToken.name || null,
          avatarUrl: decodedToken.picture || null,
          loginMethod: (decodedToken.firebase.sign_in_provider as string) || 'firebase',
          role: 'user',
          lastSignedIn: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        user = await db.getUserByOpenId(openId);
      }

      if (!user) {
        throw new AuthError("Failed to retrieve user after creation");
      }

      return user;

    } catch (error) {
      console.warn("[Auth] Token verification failed:", error);
      throw new AuthError("Invalid or expired token", 401);
    }
  }

  // Legacy methods stubbed to prevent crashes if referenced, but should ideally be removed
  // verifySession etc.
}

export const sdk = new SDKServer();
