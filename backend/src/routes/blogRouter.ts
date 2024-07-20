import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

// middleware - since all routes needs to be authenticated
blogRouter.use("/*", async (ctx, next) => {
  const authHeader = ctx.req.header("authorization") || "";

  try {
    const user = await verify(authHeader, ctx.env.JWT_SECRET);
    // Ensure that user.id is a string
    ctx.set("userId", user.id as string);
    return await next();
  } catch (error) {
    ctx.status(403);
    return ctx.json({ error: "Unauthorized" });
  }
});

// -==================================================== //

// NEW BLOG -------------------------------------------- //
blogRouter.post("/new", async (ctx) => {
  const body = await ctx.req.json();
  const authorId = ctx.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: authorId,
    },
  });
  return ctx.json({
    id: blog.id,
  });
});

// UPDATE BLOG ----------------------------------------- //
blogRouter.put("/update", async (ctx) => {
  const body = await ctx.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.post.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return ctx.json({
    message: "Blogpost updated",
    id: blog.id,
  });
});

// DELETE BLOG ----------------------------------------- //
// User can only delete their own blog - for that we need to check the authorId to match the user's id

blogRouter.delete("/:id", async (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await ctx.req.json();
  try {
    const toDelete = await prisma.post.findUnique({
      where: {
        id: body.id,
      },
    });
    if (!toDelete) {
      return ctx.json({ error: "Blog not found" }, 404);
    }
    if (toDelete.authorId !== body.authorId) {
      return ctx.json(
        { error: "You are not authorized to delete this blog" },
        403,
      );
    }
    const deleted = await prisma.post.delete({
      where: {
        id: body.id,
      },
    });
    return ctx.json({ message: "Blog deleted", id: deleted.id });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return ctx.json({ error: "Internal server error" }, 500);
  }
});

// BULK FETCH BLOGS ------------------------------------ //
// This route is for fetching multiple blogs at once

blogRouter.get("/bulk", async (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.post.findMany();

  return ctx.json(
    blogs.map((blog) => {
      return {
        title: blog.title,
      };
    }),
  );
});

// FETCH BLOG ------------------------------------------ //
blogRouter.get("/:id", async (ctx) => {
  const prisma = new PrismaClient({
    datasourceUrl: ctx.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const id = ctx.req.param("id");
  try {
    const blog = await prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!blog) {
      return ctx.json({ error: "Blog not found" }, 404);
    }

    return ctx.json({
      id: blog.id,
      title: blog.title,
      content: blog.content,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return ctx.json({ error: "Internal server error" }, 500);
  }
});
