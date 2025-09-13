// /**
//  * Apply fixes to files based on the fix plan by generating and applying diff patches
//  */
// async function applyFixesDirectly(fixPlan: FixPlan) {
//     for (const fileFix of fixPlan.filesToFix) {
//       const absoluteFilePath = path.resolve(
//         process.cwd().replace('/scripts', ''),
//         fileFix.filePath,
//       );
//       if (!fs.existsSync(absoluteFilePath)) {
//         console.warn(
//           `⚠️ File not found: ${fileFix.filePath} (absolute: ${absoluteFilePath}). Skipping fix.`,
//         );
//         continue;
//       }

//       console.log(`\n✏️ Attempting to fix ${fileFix.filePath}...`);

//       try {
//         // Read the original content
//         const originalContent = fs.readFileSync(absoluteFilePath, 'utf8');

//         // Generate a unified diff patch
//         console.log(`   🧠 Generating patch for ${fileFix.filePath}...`);
//         const { text: generatedPatch } = await generateText({
//           model: models.claude35Sonnet,
//           prompt: dedent`
//             You are an expert programmer tasked with fixing a code issue.
//             Analyze the following original file content, error context, and required modification.
//             Generate ONLY a standard unified diff patch string that applies the required modification to the original content.
//             The patch MUST apply cleanly using a standard diff/patch tool.
//             Do not include any explanations, comments, or markdown formatting around the patch itself.
//             Output only the patch string.

//             File Path: ${fileFix.filePath}

//             Error Context:
//             ${fileFix.errorContext}

//             Required Modification:
//             ${fileFix.modification}

//             Original File Content:
//             \`\`\`
//             ${originalContent}
//             \`\`\`
//           `,
//           maxTokens: 4096,
//           temperature: 0.1,
//         });

//         // Basic validation of the patch format
//         const trimmedPatch = generatedPatch.trim();
//         if (
//           !trimmedPatch ||
//           !trimmedPatch.startsWith('---') ||
//           !trimmedPatch.includes('+++')
//         ) {
//           console.warn(
//             `⚠️ Generated output does not look like a valid patch for ${fileFix.filePath}. Skipping application.`,
//           );
//           console.log(`   Raw model output:\n${generatedPatch}`); // Log for debugging
//           continue;
//         }

//         console.log(`   📄 Generated Patch:\n${trimmedPatch}`);

//         // Apply the patch
//         console.log(`   Applying patch to ${fileFix.filePath}...`);
//         const patchedContent = diff.applyPatch(originalContent, trimmedPatch);

//         if (patchedContent === false) {
//           console.warn(
//             `⚠️ Patch could not be applied cleanly to ${fileFix.filePath}. Skipping file.`,
//           );
//           await applyFixesWithNewFile(fixPlan);
//           // Optionally, log the patch and original content for debugging
//           // console.log("Original:", originalContent);
//           // console.log("Patch:", trimmedPatch);
//         } else {
//           // Write the patched content back to the file
//           fs.writeFileSync(absoluteFilePath, patchedContent);
//           console.log(`✅ Successfully patched ${fileFix.filePath}`);
//         }
//       } catch (error) {
//         console.error(
//           `❌ Error during fix application for ${fileFix.filePath}:`,
//           error,
//         );
//       }
//     }
//   }
