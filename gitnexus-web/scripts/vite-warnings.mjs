const WEB_TREE_SITTER_EVAL_WARNING_CODE = 'EVAL';
const WEB_TREE_SITTER_WARNING_PATH_FRAGMENT = '/node_modules/web-tree-sitter/tree-sitter.js';

export const isKnownWebTreeSitterEvalWarning = (warning) => {
  return warning?.code === WEB_TREE_SITTER_EVAL_WARNING_CODE
    && typeof warning?.id === 'string'
    && warning.id.includes(WEB_TREE_SITTER_WARNING_PATH_FRAGMENT);
};

export const createScopedBuildOnWarn = () => {
  return (warning, warn) => {
    if (isKnownWebTreeSitterEvalWarning(warning)) {
      return;
    }

    warn(warning);
  };
};
