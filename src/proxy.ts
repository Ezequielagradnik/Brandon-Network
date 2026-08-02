import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // El middleware aplica sesión, CSRF, CSP con nonce y headers de seguridad.
  return await updateSession(request);
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
