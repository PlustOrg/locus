# Plugin Author's Guide

The Locus plugin system allows you to extend and customize the compiler's behavior. You can use plugins to add new features, integrate with third-party services, or create custom code generators.

## Getting Started: Creating a Plugin
A plugin is a JavaScript object that defines one or more "hook" functions. These hooks are called at specific points during the Locus build lifecycle.

**1. Create a Plugin File**
Create a new JavaScript file for your plugin (e.g., `my-plugin.js`).

```javascript
// my-plugin.js
const myLocusPlugin = {
  name: 'MyAwesomePlugin',
  onParseComplete: (asts, ctx) => {
    ctx.addWarning(`Plugin loaded! Saw ${asts.length} files.`);
  },
};

export default myLocusPlugin;
```

**2. Register Your Plugin**
Create a `locus.plugins.js` file in the root of your project and export an array containing your plugin or a path to it.

```javascript
// locus.plugins.js
export default [
  './my-plugin.js', // a local plugin
  'some-npm-plugin',  // a plugin from node_modules
];
```
Locus will automatically load and register all plugins listed in this file.

## The Build Lifecycle
The Locus compiler executes hooks in a specific order. Understanding this lifecycle is key to writing effective plugins.

1.  **`onParseStart(filePath, source, ctx)`**: Called just before a `.locus` file is parsed.
2.  **`onFileParsed(filePath, ast, ctx)`**: Called after a single `.locus` file has been successfully parsed into its Abstract Syntax Tree (AST).
3.  **`onParseComplete(asts, ctx)`**: Called after all `.locus` files have been parsed. This is a good place to add or modify ASTs before they are merged.
4.  **`onValidate(unified, ctx)`**: Called after all ASTs have been merged into a single, unified tree. You can add custom validation rules here.
5.  **`onBeforeGenerate(unified, ctx)`**: Called just before the code generators run. This is your last chance to modify the unified AST.
6.  **`onAfterGenerate(result, ctx)`**: Called after all built-in Locus generators have run. `result` contains the generated `artifacts` (a map of file paths to content) and `meta` data.

## The Plugin Context (`ctx`)
Each hook function receives a `ctx` object as its last argument. This context is your API for interacting with the build process.

- **`ctx.addWarning(message)`**: Adds a warning to the build output, which will be displayed to the user.
  ```javascript
  ctx.addWarning('This is a custom warning.');
  ```
- **`ctx.addVirtualAst(ast)`**: Injects a new, programmatically-created AST into the build. This is useful for creating entities or pages on the fly.
  ```javascript
  // In onParseComplete
  const virtualPage = { ... }; // a valid page AST
  ctx.addVirtualAst(virtualPage);
  ```
- **`ctx.writeArtifact(path, content)`**: Writes a new file to the output directory. This is useful for adding files that don't depend on the main AST.
  ```javascript
  // In onAfterGenerate
  ctx.writeArtifact('custom-file.json', '{ "hello": "world" }');
  ```
- **`ctx.registerGenerator(name, fn)`**: Registers a custom generator function. This is the most powerful feature, allowing you to create your own code generators that run after the built-in ones. The function receives the unified AST and should return a map of file paths to content.
  ```javascript
  // In onBeforeGenerate
  const myGenerator = (unified) => {
    const content = `// Generated at ${new Date()}`;
    return { 'my-output.js': content };
  };
  ctx.registerGenerator('MyTimestampGenerator', myGenerator);
  ```

## Debugging Plugins
You can use the `locus plugins` command to inspect your plugins:
- **`locus plugins list`**: Shows which plugins are loaded.
- **`locus plugins doctor`**: Runs a dry run of the build lifecycle and reports which hooks your plugins are using, along with any warnings or performance metrics. This is an essential tool for debugging.
