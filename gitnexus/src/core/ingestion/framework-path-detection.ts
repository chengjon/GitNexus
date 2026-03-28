/**
 * Framework Detection
 *
 * Detects frameworks from file path patterns and provides entry point
 * multipliers for process scoring.
 */

export interface FrameworkHint {
  framework: string;
  entryPointMultiplier: number;
  reason: string;
}

/**
 * Detect framework from file path patterns.
 *
 * This provides entry point multipliers based on well-known framework conventions.
 * Returns null if no framework pattern is detected (falls back to 1.0 multiplier).
 */
export function detectFrameworkFromPath(filePath: string): FrameworkHint | null {
  let p = filePath.toLowerCase().replace(/\\/g, '/');
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }

  if (p.includes('/pages/') && !p.includes('/_') && !p.includes('/api/')) {
    if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.js')) {
      return { framework: 'nextjs-pages', entryPointMultiplier: 3.0, reason: 'nextjs-page' };
    }
  }

  if (p.includes('/app/') && (
    p.endsWith('page.tsx') || p.endsWith('page.ts') ||
    p.endsWith('page.jsx') || p.endsWith('page.js')
  )) {
    return { framework: 'nextjs-app', entryPointMultiplier: 3.0, reason: 'nextjs-app-page' };
  }

  if (p.includes('/pages/api/') || (p.includes('/app/') && p.includes('/api/') && p.endsWith('route.ts'))) {
    return { framework: 'nextjs-api', entryPointMultiplier: 3.0, reason: 'nextjs-api-route' };
  }

  if (p.includes('/app/') && (p.endsWith('layout.tsx') || p.endsWith('layout.ts'))) {
    return { framework: 'nextjs-app', entryPointMultiplier: 2.0, reason: 'nextjs-layout' };
  }

  if (p.includes('/routes/') && (p.endsWith('.ts') || p.endsWith('.js'))) {
    return { framework: 'express', entryPointMultiplier: 2.5, reason: 'routes-folder' };
  }

  if (p.includes('/controllers/') && (p.endsWith('.ts') || p.endsWith('.js'))) {
    return { framework: 'mvc', entryPointMultiplier: 2.5, reason: 'controllers-folder' };
  }

  if (p.includes('/handlers/') && (p.endsWith('.ts') || p.endsWith('.js'))) {
    return { framework: 'handlers', entryPointMultiplier: 2.5, reason: 'handlers-folder' };
  }

  if ((p.includes('/components/') || p.includes('/views/')) &&
      (p.endsWith('.tsx') || p.endsWith('.jsx'))) {
    const fileName = p.split('/').pop() || '';
    if (/^[A-Z]/.test(fileName)) {
      return { framework: 'react', entryPointMultiplier: 1.5, reason: 'react-component' };
    }
  }

  if (p.endsWith('views.py')) {
    return { framework: 'django', entryPointMultiplier: 3.0, reason: 'django-views' };
  }

  if (p.endsWith('urls.py')) {
    return { framework: 'django', entryPointMultiplier: 2.0, reason: 'django-urls' };
  }

  if ((p.includes('/routers/') || p.includes('/endpoints/') || p.includes('/routes/')) &&
      p.endsWith('.py')) {
    return { framework: 'fastapi', entryPointMultiplier: 2.5, reason: 'api-routers' };
  }

  if (p.includes('/api/') && p.endsWith('.py') && !p.endsWith('__init__.py')) {
    return { framework: 'python-api', entryPointMultiplier: 2.0, reason: 'api-folder' };
  }

  if ((p.includes('/controller/') || p.includes('/controllers/')) && p.endsWith('.java')) {
    return { framework: 'spring', entryPointMultiplier: 3.0, reason: 'spring-controller' };
  }

  if (p.endsWith('controller.java')) {
    return { framework: 'spring', entryPointMultiplier: 3.0, reason: 'spring-controller-file' };
  }

  if ((p.includes('/service/') || p.includes('/services/')) && p.endsWith('.java')) {
    return { framework: 'java-service', entryPointMultiplier: 1.8, reason: 'java-service' };
  }

  if ((p.includes('/controller/') || p.includes('/controllers/')) && p.endsWith('.kt')) {
    return { framework: 'spring-kotlin', entryPointMultiplier: 3.0, reason: 'spring-kotlin-controller' };
  }

  if (p.endsWith('controller.kt')) {
    return { framework: 'spring-kotlin', entryPointMultiplier: 3.0, reason: 'spring-kotlin-controller-file' };
  }

  if (p.includes('/routes/') && p.endsWith('.kt')) {
    return { framework: 'ktor', entryPointMultiplier: 2.5, reason: 'ktor-routes' };
  }

  if (p.includes('/plugins/') && p.endsWith('.kt')) {
    return { framework: 'ktor', entryPointMultiplier: 2.0, reason: 'ktor-plugin' };
  }
  if (p.endsWith('routing.kt') || p.endsWith('routes.kt')) {
    return { framework: 'ktor', entryPointMultiplier: 2.5, reason: 'ktor-routing-file' };
  }

  if ((p.includes('/activity/') || p.includes('/ui/')) && p.endsWith('.kt')) {
    return { framework: 'android-kotlin', entryPointMultiplier: 2.5, reason: 'android-ui' };
  }
  if (p.endsWith('activity.kt') || p.endsWith('fragment.kt')) {
    return { framework: 'android-kotlin', entryPointMultiplier: 2.5, reason: 'android-component' };
  }

  if (p.endsWith('/main.kt')) {
    return { framework: 'kotlin', entryPointMultiplier: 3.0, reason: 'kotlin-main' };
  }

  if (p.endsWith('/application.kt')) {
    return { framework: 'kotlin', entryPointMultiplier: 2.5, reason: 'kotlin-application' };
  }

  if (p.includes('/controllers/') && p.endsWith('.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 3.0, reason: 'aspnet-controller' };
  }

  if (p.endsWith('controller.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 3.0, reason: 'aspnet-controller-file' };
  }

  if ((p.includes('/services/') || p.includes('/service/')) && p.endsWith('.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 1.8, reason: 'aspnet-service' };
  }

  if (p.includes('/middleware/') && p.endsWith('.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 2.5, reason: 'aspnet-middleware' };
  }

  if (p.includes('/hubs/') && p.endsWith('.cs')) {
    return { framework: 'signalr', entryPointMultiplier: 2.5, reason: 'signalr-hub' };
  }
  if (p.endsWith('hub.cs')) {
    return { framework: 'signalr', entryPointMultiplier: 2.5, reason: 'signalr-hub-file' };
  }

  if (p.endsWith('/program.cs') || p.endsWith('/startup.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 3.0, reason: 'aspnet-entry' };
  }

  if ((p.includes('/backgroundservices/') || p.includes('/hostedservices/')) && p.endsWith('.cs')) {
    return { framework: 'aspnet', entryPointMultiplier: 2.0, reason: 'aspnet-background-service' };
  }

  if (p.includes('/pages/') && p.endsWith('.razor')) {
    return { framework: 'blazor', entryPointMultiplier: 2.5, reason: 'blazor-page' };
  }

  if ((p.includes('/handlers/') || p.includes('/handler/')) && p.endsWith('.go')) {
    return { framework: 'go-http', entryPointMultiplier: 2.5, reason: 'go-handlers' };
  }

  if (p.includes('/routes/') && p.endsWith('.go')) {
    return { framework: 'go-http', entryPointMultiplier: 2.5, reason: 'go-routes' };
  }

  if (p.includes('/controllers/') && p.endsWith('.go')) {
    return { framework: 'go-mvc', entryPointMultiplier: 2.5, reason: 'go-controller' };
  }

  if (p.endsWith('/main.go') || (p.endsWith('.go') && p.includes('/cmd/'))) {
    return { framework: 'go', entryPointMultiplier: 3.0, reason: 'go-main' };
  }

  if ((p.includes('/handlers/') || p.includes('/routes/')) && p.endsWith('.rs')) {
    return { framework: 'rust-web', entryPointMultiplier: 2.5, reason: 'rust-handlers' };
  }

  if (p.endsWith('/main.rs')) {
    return { framework: 'rust', entryPointMultiplier: 3.0, reason: 'rust-main' };
  }

  if (p.includes('/bin/') && p.endsWith('.rs')) {
    return { framework: 'rust', entryPointMultiplier: 2.5, reason: 'rust-bin' };
  }

  if (p.endsWith('/main.c') || p.endsWith('/main.cpp') || p.endsWith('/main.cc')) {
    return { framework: 'c-cpp', entryPointMultiplier: 3.0, reason: 'c-main' };
  }

  if (p.includes('/src/') && (p.endsWith('/app.c') || p.endsWith('/app.cpp'))) {
    return { framework: 'c-cpp', entryPointMultiplier: 2.5, reason: 'c-app' };
  }

  if (p.includes('/routes/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 3.0, reason: 'laravel-routes' };
  }

  if ((p.includes('/http/controllers/') || p.includes('/controllers/')) && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 3.0, reason: 'laravel-controller' };
  }

  if (p.endsWith('controller.php')) {
    return { framework: 'laravel', entryPointMultiplier: 3.0, reason: 'laravel-controller-file' };
  }

  if ((p.includes('/console/commands/') || p.includes('/commands/')) && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 2.5, reason: 'laravel-command' };
  }

  if (p.includes('/jobs/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 2.5, reason: 'laravel-job' };
  }

  if (p.includes('/listeners/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 2.5, reason: 'laravel-listener' };
  }

  if (p.includes('/http/middleware/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 2.5, reason: 'laravel-middleware' };
  }

  if (p.includes('/providers/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 1.8, reason: 'laravel-provider' };
  }

  if (p.includes('/policies/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 2.0, reason: 'laravel-policy' };
  }

  if (p.includes('/models/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 1.5, reason: 'laravel-model' };
  }

  if (p.includes('/services/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 1.8, reason: 'laravel-service' };
  }

  if (p.includes('/repositories/') && p.endsWith('.php')) {
    return { framework: 'laravel', entryPointMultiplier: 1.5, reason: 'laravel-repository' };
  }

  if (p.endsWith('/appdelegate.swift') || p.endsWith('/scenedelegate.swift') || p.endsWith('/app.swift')) {
    return { framework: 'ios', entryPointMultiplier: 3.0, reason: 'ios-app-entry' };
  }

  if (p.endsWith('app.swift') && p.includes('/sources/')) {
    return { framework: 'swiftui', entryPointMultiplier: 3.0, reason: 'swiftui-app' };
  }

  if ((p.includes('/viewcontrollers/') || p.includes('/controllers/') || p.includes('/screens/')) && p.endsWith('.swift')) {
    return { framework: 'uikit', entryPointMultiplier: 2.5, reason: 'uikit-viewcontroller' };
  }

  if (p.endsWith('viewcontroller.swift') || p.endsWith('vc.swift')) {
    return { framework: 'uikit', entryPointMultiplier: 2.5, reason: 'uikit-viewcontroller-file' };
  }

  if (p.includes('/coordinators/') && p.endsWith('.swift')) {
    return { framework: 'ios-coordinator', entryPointMultiplier: 2.5, reason: 'ios-coordinator' };
  }

  if (p.endsWith('coordinator.swift')) {
    return { framework: 'ios-coordinator', entryPointMultiplier: 2.5, reason: 'ios-coordinator-file' };
  }

  if ((p.includes('/views/') || p.includes('/scenes/')) && p.endsWith('.swift')) {
    return { framework: 'swiftui', entryPointMultiplier: 1.8, reason: 'swiftui-view' };
  }

  if (p.includes('/services/') && p.endsWith('.swift')) {
    return { framework: 'ios-service', entryPointMultiplier: 1.8, reason: 'ios-service' };
  }

  if (p.includes('/router/') && p.endsWith('.swift')) {
    return { framework: 'ios-router', entryPointMultiplier: 2.0, reason: 'ios-router' };
  }

  if (p.includes('/api/') && (
    p.endsWith('/index.ts') || p.endsWith('/index.js') ||
    p.endsWith('/__init__.py')
  )) {
    return { framework: 'api', entryPointMultiplier: 1.8, reason: 'api-index' };
  }

  return null;
}
