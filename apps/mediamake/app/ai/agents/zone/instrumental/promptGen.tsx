import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod/v4';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { TranscriptionSentence } from '@microfox/datamotion';
import { getMusicPromptsCollection } from '../db';

export const InstrumentalMusicPromptSchema = z.object({
    prompt: z.string().describe("The instrumental music prompt"),
    title: z.string().describe("The title of the instrumental music prompt"),
    storyGenres: z.array(z.string()).describe("The genres of film/tv that best suits the instrumental music prompt"),
    mood: z.string().describe("The mood of the background score"),
    tags: z.array(z.string()).describe("The tags of the background score"),
    isVocals: z.boolean().describe("Whether the background score has vocals"),
    inspiredFrom: z.string().optional().describe("The source of inspiration for the instrumental music prompt"),
})

export type InstrumentalMusicPrompt = z.infer<typeof InstrumentalMusicPromptSchema>;


/**
 * Transcription Meta Agent - /transcription-meta
 * Geerate Ai metadata for each sentence in the transcription (with word highlights)
 */
const aiRouter = new AiRouter();

export const transcriptionMetaAgent = aiRouter
    .agent('/', async ctx => {
        try {
            console.log('ctx', ctx);
            ctx.response.writeMessageMetadata({
                loader: 'Generating instrumental music prompt...',
            });

            const { userRequest } = ctx.request.params;

            const prompt = await generateObject({
                model: google('gemini-2.5-flash'),
                schema: InstrumentalMusicPromptSchema,
                schemaDescription: "The instrumental music prompt",
                prompt: `Generate an instrumental music prompt based on the user's request: ${userRequest}`,
            });

            ctx.response.writeMessageMetadata({
                loader: 'Saving Prompts to Db...',
            });

            const musicPromptCollection = await getMusicPromptsCollection();
            const result = await musicPromptCollection.insertOne({
                ...prompt.object,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            if (!result.acknowledged) {
                throw new Error('Failed to create instrumental music prompt');
            }
            const createdMusicPrompt = await musicPromptCollection.findOne({
                _id: result.insertedId,
            })
            if (!createdMusicPrompt) {
                throw new Error('Failed to create instrumental music prompt');
            }
            return prompt.object;
        } catch (error) {
            console.error('Error generating instrumental music prompt:', error);
            throw error;
        }
    })
    .actAsTool('/', {
        id: 'generateInstrumentalMusicPrompt',
        name: 'Generate Instrumental Music Prompt',
        description:
            'Generates an instrumental music prompt based on the user\'s request.',
        inputSchema: z.object({
            userRequest: z.string().describe("The user's request for the istrumental music prompt"),
            inspiration: z.string().optional().describe("The inspiration for the instrumental music prompt"),
            count: z.number().optional().describe("The number of instrumental music prompts to generate"),
        }),
        outputSchema: InstrumentalMusicPromptSchema,
        metadata: {
            icon: '🎵',
            title: 'Instrumental Music Prompt',
            category: 'instrumental',
            tags: ['lyricography', 'metadata', 'analysis', 'emotion', 'keywords'],
        },
    });

export default transcriptionMetaAgent;
