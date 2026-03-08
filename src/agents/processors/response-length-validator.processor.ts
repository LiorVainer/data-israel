/**
 * Advanced Response Validator Processor
 *
 * Output processor that validates response length constraints.
 * Aborts if the response is too short or too long.
 */

import type { Processor, ProcessorMessageResult, ProcessOutputResultArgs } from '@mastra/core/processors';

interface ResponseLengthValidatorConfig {
    minLength?: number;
    maxLength?: number;
}

export class ResponseLengthValidatorProcessor implements Processor {
    readonly id = 'response-length-validator';
    readonly name = 'Response Length Validator';

    constructor(private config: ResponseLengthValidatorConfig = {}) {}

    processOutputResult({ messages, abort }: ProcessOutputResultArgs): ProcessorMessageResult {
        const responseText = messages
            .map((msg) =>
                msg.content.parts
                    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
                    .map((part) => part.text)
                    .join(''),
            )
            .join('');

        if (this.config.minLength && responseText.length < this.config.minLength) {
            abort(`Response too short: ${responseText.length} characters (min: ${this.config.minLength})`);
        }

        if (this.config.maxLength && responseText.length > this.config.maxLength) {
            abort(`Response too long: ${responseText.length} characters (max: ${this.config.maxLength})`);
        }

        return messages;
    }
}
