import { describe, expect, it, beforeAll } from 'vitest';
import * as routeTypes from '../../src/core/ingestion/routes/types.js';
import type { ExtractedRoute } from '../../src/core/ingestion/routes/types.js';
import { extractLaravelRoutes } from '../../src/core/ingestion/routes/laravel-route-extraction.js';
import { loadLanguage, loadParser } from '../../src/core/tree-sitter/parser-loader.js';
import { SupportedLanguages } from '../../src/config/supported-languages.js';

let parser: Awaited<ReturnType<typeof loadParser>>;

async function parsePhp(source: string) {
  await loadLanguage(SupportedLanguages.PHP, 'routes/web.php');
  return parser.parse(source);
}

describe('laravel route extraction module', () => {
  beforeAll(async () => {
    parser = await loadParser();
  });

  it('resolves the new route type boundary', () => {
    const routes: ExtractedRoute[] = [];
    expect(Array.isArray(routes)).toBe(true);
    expect(routeTypes).toBeTruthy();
  });

  it('extracts a simple Route::get handler', async () => {
    const tree = await parsePhp(`<?php
Route::get('/users', [UserController::class, 'index']);
`);

    const routes = extractLaravelRoutes(tree, 'routes/web.php');

    expect(routes).toEqual([
      expect.objectContaining({
        filePath: 'routes/web.php',
        httpMethod: 'get',
        routePath: '/users',
        controllerName: 'UserController',
        methodName: 'index',
        middleware: [],
        prefix: null,
      }),
    ]);
  });

  it('extracts grouped routes with middleware and prefix composition', async () => {
    const tree = await parsePhp(`<?php
Route::middleware('auth')->prefix('api')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
`);

    const routes = extractLaravelRoutes(tree, 'routes/web.php');

    expect(routes).toEqual([
      expect.objectContaining({
        httpMethod: 'get',
        routePath: '/users',
        controllerName: 'UserController',
        methodName: 'index',
        middleware: ['auth'],
        prefix: 'api',
      }),
    ]);
  });

  it('expands apiResource routes', async () => {
    const tree = await parsePhp(`<?php
Route::apiResource('/users', UserController::class);
`);

    const routes = extractLaravelRoutes(tree, 'routes/api.php');

    expect(routes.map((route) => route.methodName)).toEqual([
      'index',
      'store',
      'show',
      'update',
      'destroy',
    ]);
  });

  it('supports controller groups with nested middleware', async () => {
    const tree = await parsePhp(`<?php
Route::middleware('auth')->controller(UserController::class)->group(function () {
    Route::get('/users', 'index');
});
`);

    const routes = extractLaravelRoutes(tree, 'routes/web.php');

    expect(routes).toEqual([
      expect.objectContaining({
        controllerName: 'UserController',
        methodName: 'index',
        middleware: ['auth'],
      }),
    ]);
  });
});
