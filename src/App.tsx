import React from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { ResultPage } from '@/pages/ResultPage';

// --- Router Setup ---

const rootRoute = createRootRoute({
  component: () => (
    <BlinkUIProvider theme="midnight" darkMode="system">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Outlet />
        <Footer />
        <Toaster />
      </div>
    </BlinkUIProvider>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard
});

const resultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/result/$id',
  component: ResultPage
});

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute, resultRoute]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
