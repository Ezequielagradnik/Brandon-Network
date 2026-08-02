import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const res = await updateSession(request);
  // Hardening de seguridad. Nota: no ponemos una CSP estricta (script/style-src)
  // para no romper el runtime de Next; solo frame-ancestors contra clickjacking.
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  return res;
}

export const config = {
  matcher: [
    /*
     * Todo menos:
     * - _next/static, _next/image
     * - favicon, assets de /brand y archivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
