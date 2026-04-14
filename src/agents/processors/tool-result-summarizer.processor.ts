import type { Processor } from '@mastra/core/processors';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { MastraDBMessage } from '@mastra/core/agent/message-list';
import { ENV } from '@/lib/env';
import { serializeResult } from '@/agents/utils';

export class ToolResultSummarizerProcessor implements Processor {
    id = 'tool-result-summarizer';
    private openrouter: ReturnType<typeof createOpenRouter>;

    constructor(
        private modelId: string = 'meta-llama/llama-2-70b-chat',
        private agentInstructions: string,
        private agentToolDescriptions: Record<string, string> = {},
    ) {
        // אתחול OpenRouter עם API key מ-environment
        this.openrouter = createOpenRouter({
            apiKey: ENV.OPENROUTER_API_KEY,
        });
    }

    async processOutputResult({
        messages,
    }: {
        messages: MastraDBMessage[];
        abort: (reason?: string) => never;
    }): Promise<MastraDBMessage[]> {
        const lastMessage = messages[messages.length - 1];

        if (lastMessage?.role === 'assistant') {
            const hasText = lastMessage.content.parts?.some((p) => p.type === 'text' && p.text?.trim().length > 0);

            if (!hasText && lastMessage.content.toolInvocations?.length) {
                // איסוף תוצאות הכלים עם התיאור שלהם
                const toolResults = lastMessage.content.toolInvocations
                    .filter((inv) => inv.state === 'result')
                    .map((inv) => ({
                        toolName: inv.toolName,
                        toolDescription: this.agentToolDescriptions[inv.toolName] || 'כלי ללא תיאור',
                        result: inv.result,
                    }));

                if (toolResults.length > 0) {
                    try {
                        // קריאה למודל OpenRouter כדי לסכם את התוצאות עם הקשר מלא
                        const { text: summary } = await generateText({
                            model: this.openrouter(this.modelId),
                            system: `אתה עוזר חכם שמסכם תוצאות של כלים.
                            עבור סוכן בינה מלאוכתית שאלה הן הגדרותיו: 
                            ${this.agentInstructions}
                             
              סכם בעברית בצורה ברורה ותמציתית.
              התמקד במידע החשוב למשתמש.
              אל תציג פרטים טכניים.
              השתמש בתיאור הכלים כדי להבין טוב יותר את ההקשר.`,
                            prompt: `הנה תוצאות מכלים שהופעלו:
              
${toolResults
    .map(
        (tr) =>
            `📊 כלי: ${tr.toolName}
תיאור: ${tr.toolDescription}
תוצאה: ${serializeResult(tr.result)}`,
    )
    .join('\n\n')}

אנא סכם את התוצאות הללו בצורה מובנת ומשימושית, תוך שימוש בתיאורי הכלים להבנה טובה יותר.`,
                        });

                        // הוספת הסיכום כתשובה טקסט
                        if (lastMessage.content.parts) {
                            lastMessage.content.parts.push({
                                type: 'text',
                                text: summary,
                            });
                        } else {
                            lastMessage.content.parts = [
                                {
                                    type: 'text',
                                    text: summary,
                                },
                            ];
                        }
                    } catch (error) {
                        console.error('Error summarizing tool results:', error);
                        // אם יש שגיאה, השתמש בתיקייה פשוטה עם תיאורים
                        const simpleText = toolResults
                            .map((tr) => `**${tr.toolName}**\n_${tr.toolDescription}_\n\n${serializeResult(tr.result)}`)
                            .join('\n\n---\n\n');

                        if (lastMessage.content.parts) {
                            lastMessage.content.parts.push({
                                type: 'text',
                                text: simpleText,
                            });
                        } else {
                            lastMessage.content.parts = [
                                {
                                    type: 'text',
                                    text: simpleText,
                                },
                            ];
                        }
                    }
                }
            }
        }

        return messages;
    }
}
