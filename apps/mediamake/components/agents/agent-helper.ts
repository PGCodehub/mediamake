import { AiRouterTools } from '@/app/ai';
import { isToolUIPart, UIMessage } from 'ai';

/**
 * Generic helper function to call any agent API endpoint
 * @param agentPath The agent path (e.g., 'youtube-metadata', 'transcription-meta')
 * @param params The parameters to send to the agent
 * @returns Promise with the agent response
 */
export async function callAgent(
  agentPath: string,
  params: Record<string, any>,
): Promise<any> {
  try {
    const response = await fetch(`/api/studio/chat/agent/${agentPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = (await response.json()) as UIMessage<any, any, any>[];
    if (result.length > 0) {
      const outputParts = result[0].parts.find(p => p.type.startsWith('tool-'));
      if (outputParts && isToolUIPart(outputParts)) {
        return outputParts.output as any;
      }
    }
    return result;
  } catch (error) {
    console.error(`Error calling agent ${agentPath}:`, error);
    throw error;
  }
}
