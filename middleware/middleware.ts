import { auth } from "@/lib/auth";

export async function getCurrentAuthUser(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session.user;
}
