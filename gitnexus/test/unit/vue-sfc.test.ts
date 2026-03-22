import { describe, expect, it } from 'vitest';
import { extractVueScriptContent, normalizeContentForParsing } from '../../src/core/ingestion/vue-sfc.js';

describe('Vue SFC helpers', () => {
  it('extracts script and script setup blocks while dropping template markup', () => {
    const source = [
      '<template>',
      '  <Widget />',
      '</template>',
      '<script lang="ts">',
      'import { ref } from "vue";',
      '</script>',
      '<script setup lang="ts">',
      'import Widget from "./Widget.vue";',
      'function loadUsers() {',
      '  return Widget && ref([]);',
      '}',
      '</script>',
      '<style scoped>',
      '.root { color: red; }',
      '</style>',
    ].join('\n');

    const extracted = extractVueScriptContent(source);

    expect(extracted).not.toBeNull();
    expect(extracted).toContain('import { ref } from "vue";');
    expect(extracted).toContain('import Widget from "./Widget.vue";');
    expect(extracted).toContain('function loadUsers() {');
    expect(extracted).not.toContain('<template>');
    expect(extracted).not.toContain('.root { color: red; }');
  });

  it('returns empty normalized content for vue files without script blocks', () => {
    const normalized = normalizeContentForParsing('src/OnlyTemplate.vue', '<template><div /></template>');
    expect(normalized).toBe('');
  });

  it('returns original content for non-vue files', () => {
    const source = 'export function loadUsers() { return []; }';
    expect(normalizeContentForParsing('src/users.ts', source)).toBe(source);
  });
});
