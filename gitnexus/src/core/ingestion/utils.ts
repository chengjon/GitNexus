import type Parser from 'tree-sitter';
import { SupportedLanguages } from '../../config/supported-languages.js';
import { generateId } from '../../lib/utils.js';
export { BUILT_IN_NAMES, isBuiltInOrNoise } from './builtins.js';

/** Tree-sitter AST node. Re-exported for use across ingestion modules. */
export type SyntaxNode = Parser.SyntaxNode;

/**
 * Ordered list of definition capture keys for tree-sitter query matches.
 * Used to extract the definition node from a capture map.
 */
export const DEFINITION_CAPTURE_KEYS = [
  'definition.function',
  'definition.class',
  'definition.interface',
  'definition.method',
  'definition.struct',
  'definition.enum',
  'definition.namespace',
  'definition.module',
  'definition.trait',
  'definition.impl',
  'definition.type',
  'definition.const',
  'definition.static',
  'definition.typedef',
  'definition.macro',
  'definition.union',
  'definition.property',
  'definition.record',
  'definition.delegate',
  'definition.annotation',
  'definition.constructor',
  'definition.template',
] as const;

/** Extract the definition node from a tree-sitter query capture map. */
export const getDefinitionNodeFromCaptures = (captureMap: Record<string, any>): any | null => {
  for (const key of DEFINITION_CAPTURE_KEYS) {
    if (captureMap[key]) return captureMap[key];
  }
  return null;
};

/**
 * Node types that represent function/method definitions across languages.
 * Used to find the enclosing function for a call site.
 */
export const FUNCTION_NODE_TYPES = new Set([
  // TypeScript/JavaScript
  'function_declaration',
  'arrow_function',
  'function_expression',
  'method_definition',
  'generator_function_declaration',
  // Python
  'function_definition',
  // Common async variants
  'async_function_declaration',
  'async_arrow_function',
  // Java
  'method_declaration',
  'constructor_declaration',
  // C/C++
  // 'function_definition' already included above
  // Go
  // 'method_declaration' already included from Java
  // C#
  'local_function_statement',
  // Rust
  'function_item',
  'impl_item', // Methods inside impl blocks
  // PHP
  'anonymous_function',
  // Kotlin
  'lambda_literal',
  // Swift
  'init_declaration',
  'deinit_declaration',
]);

/**
 * Node types for standard function declarations that need C/C++ declarator handling.
 * Used by extractFunctionName to determine how to extract the function name.
 */
export const FUNCTION_DECLARATION_TYPES = new Set([
  'function_declaration',
  'function_definition',
  'async_function_declaration',
  'generator_function_declaration',
  'function_item',
]);

/** AST node types that represent a class-like container (for HAS_METHOD edge extraction) */
export const CLASS_CONTAINER_TYPES = new Set([
  'class_declaration', 'abstract_class_declaration',
  'interface_declaration', 'struct_declaration', 'record_declaration',
  'class_specifier', 'struct_specifier',
  'impl_item', 'trait_item',
  'class_definition',
  'trait_declaration',
  'protocol_declaration',
]);

export const CONTAINER_TYPE_TO_LABEL: Record<string, string> = {
  class_declaration: 'Class',
  abstract_class_declaration: 'Class',
  interface_declaration: 'Interface',
  struct_declaration: 'Struct',
  struct_specifier: 'Struct',
  class_specifier: 'Class',
  class_definition: 'Class',
  impl_item: 'Impl',
  trait_item: 'Trait',
  trait_declaration: 'Trait',
  record_declaration: 'Record',
  protocol_declaration: 'Interface',
};

/** Walk up AST to find enclosing class/struct/interface/impl, return its generateId or null.
 *  For Go method_declaration nodes, extracts receiver type (e.g. `func (u *User) Save()` → User struct). */
export const findEnclosingClassId = (node: any, filePath: string): string | null => {
  let current = node.parent;
  while (current) {
    // Go: method_declaration has a receiver parameter with the struct type
    if (current.type === 'method_declaration') {
      const receiver = current.childForFieldName?.('receiver');
      if (receiver) {
        // receiver is a parameter_list: (u *User) or (u User)
        const paramDecl = receiver.namedChildren?.find?.((c: any) => c.type === 'parameter_declaration');
        if (paramDecl) {
          const typeNode = paramDecl.childForFieldName?.('type');
          if (typeNode) {
            // Unwrap pointer_type (*User → User)
            const inner = typeNode.type === 'pointer_type' ? typeNode.firstNamedChild : typeNode;
            if (inner && (inner.type === 'type_identifier' || inner.type === 'identifier')) {
              return generateId('Struct', `${filePath}:${inner.text}`);
            }
          }
        }
      }
    }
    if (CLASS_CONTAINER_TYPES.has(current.type)) {
      // Rust impl_item: for `impl Trait for Struct {}`, pick the type after `for`
      if (current.type === 'impl_item') {
        const children = current.children ?? [];
        const forIdx = children.findIndex((c: any) => c.text === 'for');
        if (forIdx !== -1) {
          const nameNode = children.slice(forIdx + 1).find((c: any) =>
            c.type === 'type_identifier' || c.type === 'identifier'
          );
          if (nameNode) {
            return generateId('Impl', `${filePath}:${nameNode.text}`);
          }
        }
        // Fall through: plain `impl Struct {}` — use first type_identifier below
      }
      const nameNode = current.childForFieldName?.('name')
        ?? current.children?.find((c: any) =>
          c.type === 'type_identifier' || c.type === 'identifier' || c.type === 'name'
        );
      if (nameNode) {
        const label = CONTAINER_TYPE_TO_LABEL[current.type] || 'Class';
        return generateId(label, `${filePath}:${nameNode.text}`);
      }
    }
    current = current.parent;
  }
  return null;
};

/**
 * Extract function name and label from a function_definition or similar AST node.
 * Handles C/C++ qualified_identifier (ClassName::MethodName) and other language patterns.
 */
export const extractFunctionName = (node: any): { funcName: string | null; label: string } => {
  let funcName: string | null = null;
  let label = 'Function';

  // Swift init/deinit
  if (node.type === 'init_declaration' || node.type === 'deinit_declaration') {
    return {
      funcName: node.type === 'init_declaration' ? 'init' : 'deinit',
      label: 'Constructor',
    };
  }

  if (FUNCTION_DECLARATION_TYPES.has(node.type)) {
    // C/C++: function_definition -> [pointer_declarator ->] function_declarator -> qualified_identifier/identifier
    // Unwrap pointer_declarator / reference_declarator wrappers to reach function_declarator
    let declarator = node.childForFieldName?.('declarator') ||
                        node.children?.find((c: any) => c.type === 'function_declarator');
    while (declarator && (declarator.type === 'pointer_declarator' || declarator.type === 'reference_declarator')) {
      declarator = declarator.childForFieldName?.('declarator') ||
                   declarator.children?.find((c: any) =>
                     c.type === 'function_declarator' || c.type === 'pointer_declarator' || c.type === 'reference_declarator');
    }
    if (declarator) {
      const innerDeclarator = declarator.childForFieldName?.('declarator') ||
                               declarator.children?.find((c: any) =>
                                 c.type === 'qualified_identifier' || c.type === 'identifier' || c.type === 'parenthesized_declarator');

      if (innerDeclarator?.type === 'qualified_identifier') {
        const nameNode = innerDeclarator.childForFieldName?.('name') ||
                          innerDeclarator.children?.find((c: any) => c.type === 'identifier');
        if (nameNode?.text) {
          funcName = nameNode.text;
          label = 'Method';
        }
      } else if (innerDeclarator?.type === 'identifier') {
        funcName = innerDeclarator.text;
      } else if (innerDeclarator?.type === 'parenthesized_declarator') {
        const nestedId = innerDeclarator.children?.find((c: any) =>
          c.type === 'qualified_identifier' || c.type === 'identifier');
        if (nestedId?.type === 'qualified_identifier') {
          const nameNode = nestedId.childForFieldName?.('name') ||
                            nestedId.children?.find((c: any) => c.type === 'identifier');
          if (nameNode?.text) {
            funcName = nameNode.text;
            label = 'Method';
          }
        } else if (nestedId?.type === 'identifier') {
          funcName = nestedId.text;
        }
      }
    }

    // Fallback for other languages (Kotlin uses simple_identifier, Swift uses simple_identifier)
    if (!funcName) {
      const nameNode = node.childForFieldName?.('name') ||
                        node.children?.find((c: any) => c.type === 'identifier' || c.type === 'property_identifier' || c.type === 'simple_identifier');
      funcName = nameNode?.text;
    }
  } else if (node.type === 'impl_item') {
    const funcItem = node.children?.find((c: any) => c.type === 'function_item');
    if (funcItem) {
      const nameNode = funcItem.childForFieldName?.('name') ||
                        funcItem.children?.find((c: any) => c.type === 'identifier');
      funcName = nameNode?.text;
      label = 'Method';
    }
  } else if (node.type === 'method_definition') {
    const nameNode = node.childForFieldName?.('name') ||
                      node.children?.find((c: any) => c.type === 'property_identifier');
    funcName = nameNode?.text;
    label = 'Method';
  } else if (node.type === 'method_declaration' || node.type === 'constructor_declaration') {
    const nameNode = node.childForFieldName?.('name') ||
                      node.children?.find((c: any) => c.type === 'identifier');
    funcName = nameNode?.text;
    label = 'Method';
  } else if (node.type === 'arrow_function' || node.type === 'function_expression') {
    const parent = node.parent;
    if (parent?.type === 'variable_declarator') {
      const nameNode = parent.childForFieldName?.('name') ||
                        parent.children?.find((c: any) => c.type === 'identifier');
      funcName = nameNode?.text;
    }
  }

  return { funcName, label };
};

/**
 * Yield control to the event loop so spinners/progress can render.
 * Call periodically in hot loops to prevent UI freezes.
 */
export const yieldToEventLoop = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

/**
 * Find a child of `childType` within a sibling node of `siblingType`.
 * Used for Kotlin AST traversal where visibility_modifier lives inside a modifiers sibling.
 */
export const findSiblingChild = (parent: any, siblingType: string, childType: string): any | null => {
  for (let i = 0; i < parent.childCount; i++) {
    const sibling = parent.child(i);
    if (sibling?.type === siblingType) {
      for (let j = 0; j < sibling.childCount; j++) {
        const child = sibling.child(j);
        if (child?.type === childType) return child;
      }
    }
  }
  return null;
};

/**
 * Map file extension to SupportedLanguage enum
 */
export const getLanguageFromFilename = (filename: string): SupportedLanguages | null => {
  // TypeScript (including TSX)
  if (filename.endsWith('.tsx')) return SupportedLanguages.TypeScript;
  if (filename.endsWith('.ts')) return SupportedLanguages.TypeScript;
  if (filename.endsWith('.vue')) return SupportedLanguages.TypeScript;
  // JavaScript (including JSX)
  if (filename.endsWith('.jsx')) return SupportedLanguages.JavaScript;
  if (filename.endsWith('.js')) return SupportedLanguages.JavaScript;
  // Python
  if (filename.endsWith('.py')) return SupportedLanguages.Python;
  // Java
  if (filename.endsWith('.java')) return SupportedLanguages.Java;
  // C source files
  if (filename.endsWith('.c')) return SupportedLanguages.C;
  // C++ (all common extensions, including .h)
  // .h is parsed as C++ because tree-sitter-cpp is a strict superset of C, so pure-C
  // headers parse correctly, and C++ headers (classes, templates) are handled properly.
  if (filename.endsWith('.cpp') || filename.endsWith('.cc') || filename.endsWith('.cxx') ||
      filename.endsWith('.h') || filename.endsWith('.hpp') || filename.endsWith('.hxx') || filename.endsWith('.hh')) return SupportedLanguages.CPlusPlus;
  // C#
  if (filename.endsWith('.cs')) return SupportedLanguages.CSharp;
  // Go
  if (filename.endsWith('.go')) return SupportedLanguages.Go;
  // Rust
  if (filename.endsWith('.rs')) return SupportedLanguages.Rust;
  // Kotlin
  if (filename.endsWith('.kt') || filename.endsWith('.kts')) return SupportedLanguages.Kotlin;
  // PHP (all common extensions)
  if (filename.endsWith('.php') || filename.endsWith('.phtml') ||
      filename.endsWith('.php3') || filename.endsWith('.php4') ||
      filename.endsWith('.php5') || filename.endsWith('.php8')) {
    return SupportedLanguages.PHP;
  }
  if (filename.endsWith('.swift')) return SupportedLanguages.Swift;
  return null;
};

export interface MethodSignature {
  parameterCount: number | undefined;
  returnType: string | undefined;
}

const CALL_ARGUMENT_LIST_TYPES = new Set([
  'arguments',
  'argument_list',
  'value_arguments',
]);

/**
 * Extract parameter count and return type text from an AST method/function node.
 * Works across languages by looking for common AST patterns.
 */
export const extractMethodSignature = (node: SyntaxNode | null | undefined): MethodSignature => {
  let parameterCount: number | undefined = 0;
  let returnType: string | undefined;
  let isVariadic = false;

  if (!node) return { parameterCount, returnType };

  const paramListTypes = new Set([
    'formal_parameters', 'parameters', 'parameter_list',
    'function_parameters', 'method_parameters', 'function_value_parameters',
  ]);

  // Node types that indicate variadic/rest parameters
  const VARIADIC_PARAM_TYPES = new Set([
    'variadic_parameter_declaration',  // Go: ...string
    'variadic_parameter',              // Rust: extern "C" fn(...)
    'spread_parameter',                // Java: Object... args
    'list_splat_pattern',              // Python: *args
    'dictionary_splat_pattern',        // Python: **kwargs
  ]);

  const findParameterList = (current: SyntaxNode): SyntaxNode | null => {
    for (const child of current.children) {
      if (paramListTypes.has(child.type)) return child;
    }
    for (const child of current.children) {
      const nested = findParameterList(child);
      if (nested) return nested;
    }
    return null;
  };

  const parameterList = (
    paramListTypes.has(node.type) ? node                // node itself IS the parameter list (e.g. C# primary constructors)
      : node.childForFieldName?.('parameters')
        ?? findParameterList(node)
  );

  if (parameterList && paramListTypes.has(parameterList.type)) {
    for (const param of parameterList.namedChildren) {
      if (param.type === 'comment') continue;
      if (param.text === 'self' || param.text === '&self' || param.text === '&mut self' ||
          param.type === 'self_parameter') {
        continue;
      }
      // Check for variadic parameter types
      if (VARIADIC_PARAM_TYPES.has(param.type)) {
        isVariadic = true;
        continue;
      }
      // TypeScript/JavaScript: rest parameter — required_parameter containing rest_pattern
      if (param.type === 'required_parameter' || param.type === 'optional_parameter') {
        for (const child of param.children) {
          if (child.type === 'rest_pattern') {
            isVariadic = true;
            break;
          }
        }
        if (isVariadic) continue;
      }
      // Kotlin: vararg modifier on a regular parameter
      if (param.type === 'parameter' || param.type === 'formal_parameter') {
        const prev = param.previousSibling;
        if (prev?.type === 'parameter_modifiers' && prev.text.includes('vararg')) {
          isVariadic = true;
        }
      }
      parameterCount++;
    }
    // C/C++: bare `...` token in parameter list (not a named child — check all children)
    if (!isVariadic) {
      for (const child of parameterList.children) {
        if (!child.isNamed && child.text === '...') {
          isVariadic = true;
          break;
        }
      }
    }
  }

  // Return type extraction — language-specific field names
  // Go: 'result' field is either a type_identifier or parameter_list (multi-return)
  const goResult = node.childForFieldName?.('result');
  if (goResult) {
    returnType = goResult.type === 'parameter_list'
      ? goResult.text   // multi-return: "(string, error)"
      : goResult.text;  // single return: "int"
  }

  // Rust: 'return_type' field — the value IS the type node (e.g. primitive_type, type_identifier).
  // Skip if the node is a type_annotation (TS/Python), which is handled by the generic loop below.
  if (!returnType) {
    const rustReturn = node.childForFieldName?.('return_type');
    if (rustReturn && rustReturn.type !== 'type_annotation') {
      returnType = rustReturn.text;
    }
  }

  // C/C++: 'type' field on function_definition
  if (!returnType) {
    const cppType = node.childForFieldName?.('type');
    if (cppType && cppType.text !== 'void') {
      returnType = cppType.text;
    }
  }

  // TS/Rust/Python/C#/Kotlin: type_annotation or return_type child
  if (!returnType) {
    for (const child of node.children) {
      if (child.type === 'type_annotation' || child.type === 'return_type') {
        const typeNode = child.children.find((c) => c.isNamed);
        if (typeNode) returnType = typeNode.text;
      }
    }
  }

  if (isVariadic) parameterCount = undefined;

  return { parameterCount, returnType };
};

/**
 * Count direct arguments for a call expression across common tree-sitter grammars.
 * Returns undefined when the argument container cannot be located cheaply.
 */
export const countCallArguments = (callNode: SyntaxNode | null | undefined): number | undefined => {
  if (!callNode) return undefined;

  // Direct field or direct child (most languages)
  let argsNode: SyntaxNode | null | undefined = callNode.childForFieldName('arguments')
    ?? callNode.children.find((child) => CALL_ARGUMENT_LIST_TYPES.has(child.type));

  // Kotlin/Swift: call_expression → call_suffix → value_arguments
  // Search one level deeper for languages that wrap arguments in a suffix node
  if (!argsNode) {
    for (const child of callNode.children) {
      if (!child.isNamed) continue;
      const nested = child.children.find((gc) => CALL_ARGUMENT_LIST_TYPES.has(gc.type));
      if (nested) { argsNode = nested; break; }
    }
  }

  if (!argsNode) return undefined;

  let count = 0;
  for (const child of argsNode.children) {
    if (!child.isNamed) continue;
    if (child.type === 'comment') continue;
    count++;
  }

  return count;
};

export const isVerboseIngestionEnabled = (): boolean => {
  const raw = process.env.GITNEXUS_VERBOSE;
  if (!raw) return false;
  const value = raw.toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
};

