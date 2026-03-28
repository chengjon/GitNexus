import type { FrameworkHint } from './framework-path-detection.js';
/**
 * Framework Detection
 * 
 * Detects frameworks from:
 * 1) file path patterns
 * 2) AST definition text (decorators/annotations/attributes)
 * and provides entry point multipliers for process scoring.
 * 
 * DESIGN: Returns null for unknown frameworks, which causes a 1.0 multiplier
 * (no bonus, no penalty) - same behavior as before this feature.
 */

export { detectFrameworkFromPath, type FrameworkHint } from './framework-path-detection.js';

// ============================================================================
// AST-BASED FRAMEWORK DETECTION
// ============================================================================

/**
 * Patterns that indicate framework entry points within code definitions.
 * These are matched against AST node text (class/method/function declaration text).
 */
export const FRAMEWORK_AST_PATTERNS = {
  // JavaScript/TypeScript decorators
  'nestjs': ['@Controller', '@Get', '@Post', '@Put', '@Delete', '@Patch'],
  'express': ['app.get', 'app.post', 'app.put', 'app.delete', 'router.get', 'router.post'],
  
  // Python decorators
  'fastapi': ['@app.get', '@app.post', '@app.put', '@app.delete', '@router.get'],
  'flask': ['@app.route', '@blueprint.route'],
  
  // Java annotations
  'spring': ['@RestController', '@Controller', '@GetMapping', '@PostMapping', '@RequestMapping'],
  'jaxrs': ['@Path', '@GET', '@POST', '@PUT', '@DELETE'],
  
  // C# attributes
  'aspnet': ['[ApiController]', '[HttpGet]', '[HttpPost]', '[HttpPut]', '[HttpDelete]',
             '[Route]', '[Authorize]', '[AllowAnonymous]'],
  'signalr': ['[HubMethodName]', ': Hub', ': Hub<'],
  'blazor': ['@page', '[Parameter]', '@inject'],
  'efcore': ['DbContext', 'DbSet<', 'OnModelCreating'],
  
  // Go patterns (function signatures)
  'go-http': ['http.Handler', 'http.HandlerFunc', 'ServeHTTP'],

  // PHP/Laravel
  'laravel': ['Route::get', 'Route::post', 'Route::put', 'Route::delete',
              'Route::resource', 'Route::apiResource', '#[Route('],

  // Rust macros
  'actix': ['#[get', '#[post', '#[put', '#[delete'],
  'axum': ['Router::new'],
  'rocket': ['#[get', '#[post'],

  // Swift/iOS
  'uikit': ['viewDidLoad', 'viewWillAppear', 'viewDidAppear', 'UIViewController'],
  'swiftui': ['@main', 'WindowGroup', 'ContentView', '@StateObject', '@ObservedObject'],
  'combine': ['sink', 'assign', 'Publisher', 'Subscriber'],
};

import { SupportedLanguages } from '../../config/supported-languages.js';

interface AstFrameworkPatternConfig {
  framework: string;
  entryPointMultiplier: number;
  reason: string;
  patterns: string[];
}

const AST_FRAMEWORK_PATTERNS_BY_LANGUAGE: Record<string, AstFrameworkPatternConfig[]> = {
  [SupportedLanguages.JavaScript]: [
    { framework: 'nestjs', entryPointMultiplier: 3.2, reason: 'nestjs-decorator', patterns: FRAMEWORK_AST_PATTERNS.nestjs },
  ],
  [SupportedLanguages.TypeScript]: [
    { framework: 'nestjs', entryPointMultiplier: 3.2, reason: 'nestjs-decorator', patterns: FRAMEWORK_AST_PATTERNS.nestjs },
  ],
  [SupportedLanguages.Python]: [
    { framework: 'fastapi', entryPointMultiplier: 3.0, reason: 'fastapi-decorator', patterns: FRAMEWORK_AST_PATTERNS.fastapi },
    { framework: 'flask', entryPointMultiplier: 2.8, reason: 'flask-decorator', patterns: FRAMEWORK_AST_PATTERNS.flask },
  ],
  [SupportedLanguages.Java]: [
    { framework: 'spring', entryPointMultiplier: 3.2, reason: 'spring-annotation', patterns: FRAMEWORK_AST_PATTERNS.spring },
    { framework: 'jaxrs', entryPointMultiplier: 3.0, reason: 'jaxrs-annotation', patterns: FRAMEWORK_AST_PATTERNS.jaxrs },
  ],
  [SupportedLanguages.Kotlin]: [
    { framework: 'spring-kotlin', entryPointMultiplier: 3.2, reason: 'spring-kotlin-annotation', patterns: FRAMEWORK_AST_PATTERNS.spring },
    { framework: 'jaxrs', entryPointMultiplier: 3.0, reason: 'jaxrs-annotation', patterns: FRAMEWORK_AST_PATTERNS.jaxrs },
    { framework: 'ktor', entryPointMultiplier: 2.8, reason: 'ktor-routing', patterns: ['routing', 'embeddedServer', 'Application.module'] },
    { framework: 'android-kotlin', entryPointMultiplier: 2.5, reason: 'android-annotation', patterns: ['@AndroidEntryPoint', 'AppCompatActivity', 'Fragment('] },
  ],
  [SupportedLanguages.CSharp]: [
    { framework: 'aspnet', entryPointMultiplier: 3.2, reason: 'aspnet-attribute', patterns: FRAMEWORK_AST_PATTERNS.aspnet },
    { framework: 'signalr', entryPointMultiplier: 2.8, reason: 'signalr-attribute', patterns: FRAMEWORK_AST_PATTERNS.signalr },
    { framework: 'blazor', entryPointMultiplier: 2.5, reason: 'blazor-attribute', patterns: FRAMEWORK_AST_PATTERNS.blazor },
    { framework: 'efcore', entryPointMultiplier: 2.0, reason: 'efcore-pattern', patterns: FRAMEWORK_AST_PATTERNS.efcore },
  ],
  [SupportedLanguages.PHP]: [
    { framework: 'laravel', entryPointMultiplier: 3.0, reason: 'php-route-attribute', patterns: FRAMEWORK_AST_PATTERNS.laravel },
  ],
};

/** Pre-lowercased patterns for O(1) pattern matching at runtime */
const AST_PATTERNS_LOWERED: Record<string, Array<{ framework: string; entryPointMultiplier: number; reason: string; patterns: string[] }>> =
  Object.fromEntries(
    Object.entries(AST_FRAMEWORK_PATTERNS_BY_LANGUAGE).map(([lang, cfgs]) => [
      lang,
      cfgs.map(cfg => ({ ...cfg, patterns: cfg.patterns.map(p => p.toLowerCase()) })),
    ])
  );

/**
 * Detect framework entry points from AST definition text (decorators/annotations/attributes).
 * Returns null if no known pattern is found.
 * Note: callers should slice definitionText to ~300 chars since annotations appear at the start.
 */
export function detectFrameworkFromAST(
  language: SupportedLanguages,
  definitionText: string
): FrameworkHint | null {
  if (!language || !definitionText) return null;

  const configs = AST_PATTERNS_LOWERED[language.toLowerCase()];
  if (!configs || configs.length === 0) return null;

  const normalized = definitionText.toLowerCase();

  for (const cfg of configs) {
    for (const pattern of cfg.patterns) {
      if (normalized.includes(pattern)) {
        return {
          framework: cfg.framework,
          entryPointMultiplier: cfg.entryPointMultiplier,
          reason: cfg.reason,
        };
      }
    }
  }

  return null;
}
