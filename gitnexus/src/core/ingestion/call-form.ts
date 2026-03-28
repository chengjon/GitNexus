import type Parser from 'tree-sitter';

export type SyntaxNode = Parser.SyntaxNode;
export type CallForm = 'free' | 'member' | 'constructor';

/**
 * AST node types that indicate a member-access wrapper around the callee name.
 * When nameNode.parent.type is one of these, the call is a member call.
 */
const MEMBER_ACCESS_NODE_TYPES = new Set([
  'member_expression',
  'attribute',
  'member_access_expression',
  'field_expression',
  'selector_expression',
  'navigation_suffix',
]);

/**
 * Call node types that are inherently constructor invocations.
 * Only includes patterns that the tree-sitter queries already capture as @call.
 */
const CONSTRUCTOR_CALL_NODE_TYPES = new Set([
  'constructor_invocation',
  'new_expression',
  'object_creation_expression',
  'implicit_object_creation_expression',
  'composite_literal',
  'struct_expression',
]);

/**
 * AST node types for scoped/qualified calls (e.g., Foo::new() in Rust, Foo::bar() in C++).
 */
const SCOPED_CALL_NODE_TYPES = new Set([
  'scoped_identifier',
  'qualified_identifier',
]);

/**
 * Infer whether a captured call site is a free call, member call, or constructor.
 * Returns undefined if the form cannot be determined.
 */
export const inferCallForm = (
  callNode: SyntaxNode,
  nameNode: SyntaxNode,
): CallForm | undefined => {
  if (CONSTRUCTOR_CALL_NODE_TYPES.has(callNode.type)) {
    return 'constructor';
  }

  const nameParent = nameNode.parent;
  if (nameParent && MEMBER_ACCESS_NODE_TYPES.has(nameParent.type)) {
    return 'member';
  }

  if (callNode.type === 'member_call_expression' || callNode.type === 'nullsafe_member_call_expression') {
    return 'member';
  }
  if (callNode.type === 'scoped_call_expression') {
    return 'member';
  }

  if (callNode.type === 'method_invocation' && callNode.childForFieldName('object')) {
    return 'member';
  }

  if (nameParent && SCOPED_CALL_NODE_TYPES.has(nameParent.type)) {
    return 'free';
  }

  if (nameNode.parent === callNode || nameParent?.parent === callNode) {
    return 'free';
  }

  return undefined;
};

/**
 * Extract the receiver identifier for member calls.
 * Only captures simple identifiers — returns undefined for complex expressions.
 */
const SIMPLE_RECEIVER_TYPES = new Set([
  'identifier',
  'simple_identifier',
  'variable_name',
  'name',
  'this',
  'self',
]);

export const extractReceiverName = (
  nameNode: SyntaxNode,
): string | undefined => {
  const parent = nameNode.parent;
  if (!parent) return undefined;

  const callNode = parent.parent ?? parent;
  let receiver: SyntaxNode | null = null;

  receiver = parent.childForFieldName('object')
    ?? parent.childForFieldName('value')
    ?? parent.childForFieldName('operand')
    ?? parent.childForFieldName('expression')
    ?? parent.childForFieldName('argument');

  if (!receiver && callNode.type === 'method_invocation') {
    receiver = callNode.childForFieldName('object');
  }

  if (!receiver && (callNode.type === 'member_call_expression' || callNode.type === 'nullsafe_member_call_expression')) {
    receiver = callNode.childForFieldName('object');
  }

  if (!receiver && parent.type === 'navigation_suffix') {
    const navExpr = parent.parent;
    if (navExpr?.type === 'navigation_expression') {
      receiver = navExpr.childForFieldName('object') ?? navExpr.children?.[0] ?? null;
    }
  }

  if (!receiver) return undefined;
  if (!SIMPLE_RECEIVER_TYPES.has(receiver.type)) return undefined;

  return receiver.text;
};
