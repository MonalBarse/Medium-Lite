import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

// NEW USER -------------------------------- //
userRouter.post("/signup", async (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await ctx.req.json();

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
    const jwt = await sign({ id: user.id }, ctx.env.JWT_SECRET);
    return ctx.json({ token: jwt });
  } catch (err) {
    ctx.status(403);
    return ctx.json({ error: "User already exists" });
  }
});

// LOGIN USER ------------------------------ //
userRouter.post("/signin", async (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await ctx.req.json();

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  // if no user found
  if (!user) {
    ctx.status(404);
    return ctx.json({ error: "User not found" });
  }

  // if user found
  const isPasswordCorrect = user.password === body.password;
  if (!isPasswordCorrect) {
    ctx.status(403);
    return ctx.json({ error: "Invalid password" });
  }

  const jwt = await sign({ id: user.id }, ctx.env.JWT_SECRET);
  return ctx.json({ token: jwt });
});

/* app.post("/api/v1/user/signup", (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
    // datasourceUrl: ctx.env.DATABASE_URL, this will give an error cuz the ctx type is unknown and we expect it to be a String, if we did not pass Bindings to the Hono type
  }).$extends(withAccelerate());
  // extends - add extensions, withAccelerate - db connection pooling

  return ctx.text("Hello World");
});
*/
