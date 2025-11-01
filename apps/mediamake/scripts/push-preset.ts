#!/usr/bin/env node

/**
 * Script to push a preset from private registry to database
 * Usage: npm run push <presetname>
 */

import { config } from 'dotenv';
import { resolve, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import * as ts from 'typescript';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function pushPreset(presetName: string) {
  try {
    // Construct path to the preset file
    const presetPath = join(
      process.cwd(),
      'components',
      'editor',
      'presets',
      'registry',
      'private',
      `${presetName}.ts`,
    );

    console.log(`📂 Looking for preset file: ${presetPath}`);

    if (!existsSync(presetPath)) {
      console.error(`❌ Error: Preset file not found at ${presetPath}`);
      console.error(
        `   Make sure the file exists in components/editor/presets/registry/private/`,
      );
      process.exit(1);
    }

    // Read and evaluate the preset file
    // Since we're running with tsx, we can use dynamic import with the resolved path
    // Convert to file:// URL for proper module resolution
    const fileUrl = `file://${resolve(presetPath)}`;

    let presetModule: any;
    try {
      // Try dynamic import first (works with tsx)
      presetModule = await import(fileUrl);
    } catch (importError: any) {
      // Fallback to require (tsx supports require for .ts files)
      try {
        // Clear cache first
        const resolvedPath = resolve(presetPath);
        delete require.cache[resolvedPath];
        // Use require - tsx will compile TypeScript on the fly
        presetModule = require(resolvedPath);
      } catch (requireError: any) {
        throw new Error(
          `Failed to import preset file. Make sure it exports 'presetData'. Import error: ${importError.message}, Require error: ${requireError.message}`,
        );
      }
    }

    if (!presetModule.presetData) {
      console.error(`❌ Error: Preset file does not export 'presetData'`);
      console.error(`   The file should export: export { presetData }`);
      process.exit(1);
    }

    const presetData = presetModule.presetData;

    // Validate presetData structure
    if (
      !presetData.metadata ||
      !presetData.presetFunction ||
      !presetData.presetParams
    ) {
      console.error(`❌ Error: Invalid presetData structure`);
      console.error(
        `   presetData must contain: metadata, presetFunction, presetParams`,
      );
      process.exit(1);
    }

    console.log(`✅ Loaded preset: ${presetData.metadata.title}`);
    console.log(`   ID: ${presetData.metadata.id}`);
    console.log(`   Type: ${presetData.metadata.presetType}`);

    // Run lint check (ignoring common preset file issues)
    console.log(`🔍 Running lint check...`);
    try {
      // Run eslint on the file, ignoring specific rules that are common in preset files
      // Ignore @typescript-eslint/no-explicit-any and @typescript-eslint/no-unused-vars
      execSync(
        `npx eslint "${presetPath}" --rule "@typescript-eslint/no-explicit-any: off" --rule "@typescript-eslint/no-unused-vars: warn" --max-warnings 999`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env },
        },
      );
      console.log(`✅ Lint check passed`);
    } catch (lintError: any) {
      // Only fail on non-error status codes (actual ESLint errors, not warnings)
      if (lintError.status === 1) {
        // Check if there are actual errors (not just warnings)
        // Re-run with stricter check to see if there are real errors
        try {
          execSync(
            `npx eslint "${presetPath}" --rule "@typescript-eslint/no-explicit-any: off" --rule "@typescript-eslint/no-unused-vars: off"`,
            {
              stdio: 'pipe',
              cwd: process.cwd(),
              env: { ...process.env },
            },
          );
          // If we get here, there are no real errors, just warnings
          console.log(`✅ Lint check passed (warnings ignored)`);
        } catch (realError: any) {
          console.error(`❌ Lint check failed`);
          console.error(`   Fix linting errors before pushing the preset`);
          process.exit(1);
        }
      } else {
        // ESLint command failed (not installed, config issue, etc.)
        console.error(`❌ Lint check failed`);
        console.error(
          `   ESLint error (code ${lintError.status || 'unknown'}): ${lintError.message}`,
        );
        process.exit(1);
      }
    }

    // Validate that helper functions are inside presetExecution
    console.log(`🔍 Validating preset structure...`);
    const fileContent = readFileSync(presetPath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      presetPath,
      fileContent,
      ts.ScriptTarget.Latest,
      true,
    );

    const allowedTopLevelNames = [
      'presetParams',
      'presetExecution',
      'presetMetadata',
      'presetFunction',
      'presetParamsSchema',
      'presetData',
      'Effect',
    ];

    const errors: string[] = [];
    let presetExecutionNode: ts.Node | null = null;

    // First pass: find presetExecution
    function findPresetExecution(node: ts.Node) {
      // Check for function declaration: const presetExecution = async (...) => {...}
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            decl.name.text === 'presetExecution' &&
            decl.initializer
          ) {
            if (
              ts.isArrowFunction(decl.initializer) ||
              ts.isFunctionExpression(decl.initializer)
            ) {
              presetExecutionNode = decl.initializer;
              return;
            }
          }
        }
      }

      // Check for function declaration: async function presetExecution(...) {...}
      if (
        ts.isFunctionDeclaration(node) &&
        node.name?.text === 'presetExecution'
      ) {
        presetExecutionNode = node;
        return;
      }

      ts.forEachChild(node, findPresetExecution);
    }

    findPresetExecution(sourceFile);

    if (!presetExecutionNode) {
      errors.push('presetExecution function not found in the file');
    }

    // Second pass: check for helper functions outside presetExecution at top level
    function checkTopLevelDeclarations(node: ts.Node) {
      // Only check direct children of SourceFile (top-level declarations)
      if (!ts.isSourceFile(node)) {
        ts.forEachChild(node, checkTopLevelDeclarations);
        return;
      }

      // Check all top-level statements
      for (const statement of node.statements) {
        let name: string | null = null;

        if (ts.isVariableStatement(statement)) {
          // Check if it's presetExecution assignment
          for (const decl of statement.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              if (decl.name.text === 'presetExecution') {
                continue; // Skip presetExecution itself
              }
              name = decl.name.text;
            }
          }
        } else if (ts.isFunctionDeclaration(statement)) {
          if (statement.name?.text === 'presetExecution') {
            continue; // Skip presetExecution itself
          }
          name = statement.name?.text || null;
        } else if (ts.isClassDeclaration(statement)) {
          if (statement.name?.text === 'presetExecution') {
            continue; // Skip presetExecution itself
          }
          name = statement.name?.text || null;
        }

        // Check if this is an allowed top-level name
        if (name && !allowedTopLevelNames.includes(name)) {
          const lineAndChar = sourceFile.getLineAndCharacterOfPosition(
            statement.getStart(),
          );
          errors.push(
            `Helper function/const '${name}' found at line ${lineAndChar.line + 1}:${lineAndChar.character + 1}. All helper functions must be defined inside presetExecution.`,
          );
        }
      }
    }

    checkTopLevelDeclarations(sourceFile);

    if (errors.length > 0) {
      console.error(`❌ Preset structure validation failed:`);
      errors.forEach(error => {
        console.error(`   - ${error}`);
      });
      console.error(
        `   All helper functions must be defined inside the presetExecution function body.`,
      );
      process.exit(1);
    }

    console.log(`✅ Preset structure validation passed`);

    // Get the base URL from environment or default to localhost
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      'http://localhost:3000';

    const url = `${baseUrl}/api/presets/push`;

    console.log(`🚀 Pushing preset to database...`);
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEV_API_KEY}`,
      },
      body: JSON.stringify({ presetData }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Error: ${data.error}`);
      if (data.details) {
        console.error(`   Details: ${data.details}`);
      }
      process.exit(1);
    }

    console.log(`✅ Success: ${data.message}`);
    console.log(`📦 Database ID: ${data.preset._id}`);
    console.log(`📝 Title: ${data.preset.metadata.title}`);
    console.log(`🏷️  Type: ${data.preset.metadata.presetType}`);
  } catch (error: any) {
    console.error(`❌ Failed to push preset:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error(`   Make sure the Next.js server is running (npm run dev)`);
    }
    process.exit(1);
  }
}

// Get preset name from command line arguments
const presetName = process.argv[2];

if (!presetName) {
  console.error('❌ Error: preset name is required');
  console.error('   Usage: npm run push <presetname>');
  console.error('   Example: npm run push broll-clone');
  process.exit(1);
}

// Helper function to get the name of a declaration node
function getNodeName(
  node: ts.VariableStatement | ts.FunctionDeclaration | ts.ClassDeclaration,
): string | null {
  if (ts.isFunctionDeclaration(node)) {
    return node.name?.text || null;
  }
  if (ts.isClassDeclaration(node)) {
    return node.name?.text || null;
  }
  if (ts.isVariableStatement(node)) {
    if (
      node.declarationList.declarations.length > 0 &&
      ts.isIdentifier(node.declarationList.declarations[0].name)
    ) {
      return node.declarationList.declarations[0].name.text;
    }
  }
  return null;
}

pushPreset(presetName);
