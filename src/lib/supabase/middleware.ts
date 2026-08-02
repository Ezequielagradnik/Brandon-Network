import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // --- CSRF: en mutaciones a /api exigimos que el Origin sea del mismo host ---
  if (
    pathname.startsWith("/api") &&
    !["GET", "HEAD", "OPTIONS"].includes(method)
  ) {
    const origin = request.headers.get("origin");
    if (origin) {
      let ok = false;
      try {
        ok = new URL(origin).host === request.headers.get("host");
      } catch {
        ok = false;
      }
      if (!ok) return new NextResponse("Origen no permitido", { status: 403 });
    }
  }

  // --- CSP con nonce (script-src estricto); estilos inline permitidos porque
  // la app usa atributos style=... en varios componentes ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supaWss = supaUrl.replace(/^https/, "wss");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supaUrl} ${supaWss}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const harden = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    return res;
  };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ya no hay página /login: el login vive en el modal de la landing.
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return harden(NextResponse.redirect(url));
  }

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  // Sin sesión y entrando a algo protegido -> landing
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return harden(NextResponse.redirect(url));
  }

  // Con sesión y parado en la landing -> al dashboard
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return harden(NextResponse.redirect(url));
  }

  // Gate de /admin: solo rol admin
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return harden(NextResponse.redirect(url));
    }
  }

  return harden(supabaseResponse);
}
