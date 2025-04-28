import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
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
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();

    // Public routes
    const publicRoutes = ['/login', '/auth/callback'];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith('/api/')
    );

    // If not a public route and no session, redirect to login
    if (!isPublicRoute && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If login route and has session, redirect to dashboard
    if (request.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (e) {
    console.error('Supabase client error:', e);
    
    // Default fallback - proceed with the request
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
