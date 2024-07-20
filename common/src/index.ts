import z from "zod";

export const signupInput = z.object({
  username: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginInput = z.object({
  username: z.string().email(),
  password: z.string().min(8),
});

export const createBlogInput = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlogInput = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export type UpdateBlogInput = z.infer<typeof createBlogInput>;
export type CreateBlogInput = z.infer<typeof createBlogInput>;
export type LoginInput = z.infer<typeof loginInput>;
export type SignupInput = z.infer<typeof signupInput>;
