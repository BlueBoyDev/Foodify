import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes (Menu, Login)
  const isPublicRoute = 
    pathname.startsWith('/menu') || 
    pathname === '/login' || 
    pathname === '/codex/login';

  const token = request.cookies.get('foodify_token')?.value;

  // In a real app, we would verify the JWT here.
  // For now, since we're using Zustand + Persist (localstorage),
  // middleware won't easily see the session. 
  // We'll rely on the 'useRoleGuard' hook or similar client-side check,
  // but we can at least set up the matcher/structure.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/codex/:path*'],
};
