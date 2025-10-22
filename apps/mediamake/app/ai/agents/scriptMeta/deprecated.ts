// let overallAnalysisObject = undefined;
// let transcriptionInfoObject = undefined;

// // Generate overall analysis
// if (overallAnalysis) {
//   const overallAnalysisResult = await generateObject({
//     model: google('gemini-2.5-flash'),
//     schema: OverallAnalysisSchema as any,
//     prompt: `Based on the following sentence analysis, provide an overall assessment:

// ${analysisResults
// .map(
// result =>
// `Sentence ${result.sentenceIndex}: "${result.originalText}"
// - Keyword: ${result.metadata.keyword}
// - Strength: ${result.metadata.strength}/10
// - Keyword Feel: ${result.metadata.keywordFeel}
// - Confidence: ${result.metadata.confidence}`,
// )
// .join('\n\n')}
// ${userRequest ? `\nUser Request: ${userRequest}` : ''}

// Provide an overall analysis of the transcription's mood, structure recommendations, key themes, and emotional arc.
// ${userRequest ? `Please consider the user's specific request: ${userRequest}` : ''}`,
//     maxRetries: 2,
//   });
//   overallAnalysisObject = overallAnalysisResult.object;
//   console.log('overallUsgae', overallAnalysisResult.usage);
// }
