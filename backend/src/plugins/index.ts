import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import oauthPlugin from "@fastify/oauth2";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { env } from "../config/env";


export async function registerPlugins(app: FastifyInstance) {
  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: env.NODE_ENV === "production",
    crossOriginOpenerPolicy: env.NODE_ENV === "production",
  });

  // Cookies
  await app.register(cookie);

  // CORS
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });

  // Google OAuth
  await app.register(oauthPlugin, {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/google",
    callbackUri: `${env.FRONTEND_URL.replace('5173', '4000').replace('http://localhost', 'http://localhost')}/auth/google/callback`,
  });

  // GitHub OAuth
  await app.register(oauthPlugin, {
    name: "githubOAuth2",
    scope: ["user:email"],
    credentials: {
      client: {
        id: env.GITHUB_CLIENT_ID,
        secret: env.GITHUB_CLIENT_SECRET,
      },
      auth: oauthPlugin.GITHUB_CONFIGURATION,
    },
    startRedirectPath: "/auth/github",
    callbackUri: `${env.FRONTEND_URL.replace('5173', '4000').replace('http://localhost', 'http://localhost')}/auth/github/callback`,
  });

  // Apple OAuth
  await app.register(oauthPlugin, {
    name: "appleOAuth2",
    scope: ["name", "email"],
    credentials: {
      client: {
        id: env.APPLE_CLIENT_ID,
        secret: env.APPLE_CLIENT_SECRET,
      },
      auth: oauthPlugin.APPLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/apple",
    callbackUri: `${env.FRONTEND_URL.replace('5173', '4000').replace('http://localhost', 'http://localhost')}/auth/apple/callback`,
  });
}
