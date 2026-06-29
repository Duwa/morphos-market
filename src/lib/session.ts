import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "morphos_uid";

// Cookie-based lightweight identity: first request mints a play-money account.
export async function getOrCreateUser() {
  const jar = await cookies();
  const uid = jar.get(COOKIE)?.value;

  if (uid) {
    const existing = await prisma.user.findUnique({ where: { id: uid } });
    if (existing) return existing;
  }

  const n = await prisma.user.count();
  const user = await prisma.user.create({
    data: { handle: `operator_${(n + 1).toString().padStart(4, "0")}` },
  });
  jar.set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return user;
}
