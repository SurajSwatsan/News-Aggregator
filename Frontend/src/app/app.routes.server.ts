import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // SEO-critical pages use Server-side rendering
  { path: '', renderMode: RenderMode.Server },
  { path: 'article/:id', renderMode: RenderMode.Server },

  // Everything else (Dashboards, Auth, Onboarding, Login) renders ONLY on the client
  // to avoid issues with missing localStorage/tokens during SSR which causes 401 redirects
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
