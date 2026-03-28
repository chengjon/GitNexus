import { extractStringContent, findDescendant } from '../routes/php-route-shared.js';

/** Eloquent model properties whose array values are worth indexing. */
const ELOQUENT_ARRAY_PROPS = new Set(['fillable', 'casts', 'hidden', 'guarded', 'with', 'appends']);

/** Eloquent relationship method names. */
const ELOQUENT_RELATIONS = new Set([
  'hasMany', 'hasOne', 'belongsTo', 'belongsToMany',
  'morphTo', 'morphMany', 'morphOne', 'morphToMany', 'morphedByMany',
  'hasManyThrough', 'hasOneThrough',
]);

/**
 * For a PHP property_declaration node, extract array values as a description string.
 * Returns null if not an Eloquent model property or no array values found.
 */
export function extractPhpPropertyDescription(propName: string, propDeclNode: any): string | null {
  if (!ELOQUENT_ARRAY_PROPS.has(propName)) return null;

  const arrayNode = findDescendant(propDeclNode, 'array_creation_expression');
  if (!arrayNode) return null;

  const items: string[] = [];
  for (const child of (arrayNode.children ?? [])) {
    if (child.type !== 'array_element_initializer') continue;
    const children = child.children ?? [];
    const arrowIdx = children.findIndex((c: any) => c.type === '=>');
    if (arrowIdx !== -1) {
      const key = extractStringContent(children[arrowIdx - 1]);
      const val = extractStringContent(children[arrowIdx + 1]);
      if (key && val) items.push(`${key}:${val}`);
    } else {
      const val = extractStringContent(children[0]);
      if (val) items.push(val);
    }
  }

  return items.length > 0 ? items.join(', ') : null;
}

/**
 * For a PHP method_declaration node, detect if it defines an Eloquent relationship.
 * Returns description like "hasMany(Post)" or null.
 */
export function extractEloquentRelationDescription(methodNode: any): string | null {
  function findRelationCall(node: any): any {
    if (node.type === 'member_call_expression') {
      const children = node.children ?? [];
      const objectNode = children.find((c: any) => c.type === 'variable_name' && c.text === '$this');
      const nameNode = children.find((c: any) => c.type === 'name');
      if (objectNode && nameNode && ELOQUENT_RELATIONS.has(nameNode.text)) return node;
    }
    for (const child of (node.children ?? [])) {
      const found = findRelationCall(child);
      if (found) return found;
    }
    return null;
  }

  const callNode = findRelationCall(methodNode);
  if (!callNode) return null;

  const relType = callNode.children?.find((c: any) => c.type === 'name')?.text;
  const argsNode = callNode.children?.find((c: any) => c.type === 'arguments');
  let targetModel: string | null = null;
  if (argsNode) {
    const firstArg = argsNode.children?.find((c: any) => c.type === 'argument');
    if (firstArg) {
      const classConstant = firstArg.children?.find((c: any) =>
        c.type === 'class_constant_access_expression'
      );
      if (classConstant) {
        targetModel = classConstant.children?.find((c: any) => c.type === 'name')?.text ?? null;
      }
    }
  }

  if (relType && targetModel) return `${relType}(${targetModel})`;
  if (relType) return relType;
  return null;
}
