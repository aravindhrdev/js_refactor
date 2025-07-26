import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

export function analyzeJS(code) {
  try {
    console.log('typeof traverse:', typeof traverse);

    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
    });

    const analyzedItems = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        analyzedItems.push({
          type: 'function',
          name: path.node.id?.name || 'Anonymous',
          code: code.slice(path.node.start, path.node.end),
          line: path.node.loc?.start?.line,
          suggestions: ['Consider refactoring for better readability.'],
        });
      },

      ArrowFunctionExpression(path) {
        analyzedItems.push({
          type: 'arrow-function',
          name: 'Anonymous Arrow Function',
          code: code.slice(path.node.start, path.node.end),
          line: path.node.loc?.start?.line,
          suggestions: ['Consider naming this function for better clarity.'],
        });
      },

      ClassDeclaration(path) {
        analyzedItems.push({
          type: 'class',
          name: path.node.id?.name || 'Unnamed Class',
          code: code.slice(path.node.start, path.node.end),
          line: path.node.loc?.start?.line,
          suggestions: ['Class should have methods organized logically.'],
        });
      },

      FunctionExpression(path) {
        analyzedItems.push({
          type: 'function-expression',
          name: 'Anonymous Function',
          code: code.slice(path.node.start, path.node.end),
          line: path.node.loc?.start?.line,
          suggestions: ['Consider naming this function for better clarity.'],
        });
      },

      VariableDeclaration(path) {
        path.node.declarations.forEach(declaration => {
          if (!declaration.init) {
            analyzedItems.push({
              type: 'variable-declaration',
              name: declaration.id.name,
              code: code.slice(path.node.start, path.node.end),
              line: path.node.loc?.start?.line,
              suggestions: ['Consider initializing this variable or removing it if unused.'],
            });
          }
        });
      },
    });

    return { analyzedItems };
  } catch (err) {
    console.error('Error parsing code:', err);
    throw new Error('Failed to parse JS code');
  }
}

