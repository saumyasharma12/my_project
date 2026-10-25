import type { FastifyPluginAsync } from "fastify";
import { config } from "../../config/index.js";
import { sendError } from "../../common/http.js";
import { loginBodySchema, registerBodySchema } from "./auth.schema.js";
import { getUserFromRequest, loginUser, logoutUser, registerUser } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", async (request, reply) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      return reply.code(401).send({ error: "Authentication required." });
    }
    return { user };
  });

  app.post("/register", async (request, reply) => {
    try {
      const body = registerBodySchema.parse(request.body);
      const result = await registerUser(body);
      reply.setCookie(config.sessionCookieName, result.token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: config.sessionTtlDays * 24 * 60 * 60,
      });
      return { user: result.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      return sendError(reply, 400, message);
    }
  });

  app.post("/login", async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body);
      const result = await loginUser(body);
      reply.setCookie(config.sessionCookieName, result.token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: config.sessionTtlDays * 24 * 60 * 60,
      });
      return { user: result.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return sendError(reply, 401, message);
    }
  });

  app.post("/logout", async (request, reply) => {
    await logoutUser(request);
    reply.clearCookie(config.sessionCookieName, { path: "/" });
    return { ok: true };
  });
};
