## 1. EnsureTextOutput Processor

> **Skill:** Use the `mastra` skill to look up the Processor interface, `processInputStep`, and `ProcessInputStepResult` types.
> **Docs:** Read `docs/research/2026-03-06-mastra-subagent-empty-text-research.md` for the full API reference.

- [x] 1.1 Create `agents/processors/ensure-text-output.processor.ts`

  Implements `Processor` from `@mastra/core/processors`. Uses `processInputStep` to force text generation:

  ```typescript
  import type { Processor, ProcessInputStepArgs, ProcessInputStepResult } from '@mastra/core/processors';

  export class EnsureTextOutputProcessor implements Processor {
    readonly id = 'ensure-text-output';
    constructor(private readonly stepThreshold: number = 8) {}

    async processInputStep({
      stepNumber, steps, systemMessages,
    }: ProcessInputStepArgs): Promise<ProcessInputStepResult | void> {
      const hasToolCalls = steps.some(s => s.toolCalls?.length);
      if (!hasToolCalls) return; // First step — don't interfere

      const hasText = steps.some(s => s.text?.trim());
      if (stepNumber >= this.stepThreshold && !hasText) {
        return {
          toolChoice: 'none',  // Force text generation, no more tool calls
          systemMessages: [
            ...systemMessages,
            {
              role: 'system',
              content: 'חובה: כתוב עכשיו תשובה טקסטואלית מסכמת בעברית. סכם את כל הממצאים מתוצאות הכלים. אסור לקרוא לכלים נוספים.',
            },
          ],
        };
      }
    }
  }
  ```

  **Verify types:** Check `StepResult` shape — confirm `toolCalls` and `text` fields exist. Use mastra skill/context7 docs if unsure about the exact type path.

- [x] 1.2 Register processor on datagovAgent in `agents/network/datagov/data-gov.agent.ts`

  Add `inputProcessors` to the `Agent` constructor:
  ```typescript
  import { EnsureTextOutputProcessor } from '../../processors/ensure-text-output.processor';

  return new Agent({
      // ... existing config ...
      inputProcessors: [new EnsureTextOutputProcessor()],
  });
  ```

  **Note:** `inputProcessors` is typed as `DynamicArgument<InputProcessorOrWorkflow[]>` on the Agent constructor (confirmed in `@mastra/core/dist/agent/types.d.ts:206`).

- [x] 1.3 Register same processor on cbsAgent in `agents/network/cbs/cbs.agent.ts`

  Same pattern as 1.2.

## 2. Delegation Hooks

> **Skill:** Use the `mastra` skill to look up `DelegationConfig`, `onDelegationStart`, and `onDelegationComplete` hooks.
> **Key types:** `DelegationStartResult` (has `modifiedMaxSteps`), `DelegationCompleteResult` (has `feedback`), both in `@mastra/core/dist/agent/agent.types.d.ts`.

- [x] 2.1 Add `delegation` to `handleChatStream` defaultOptions in `app/api/chat/route.ts`

  The `defaultOptions` object (line ~276) is typed as `AgentExecutionOptions` which accepts `delegation?: DelegationConfig`. Add inside the existing `defaultOptions` block:

  ```typescript
  delegation: {
      onDelegationStart: async () => {
          return { modifiedMaxSteps: 15 };
      },
      onDelegationComplete: async (context) => {
          if (context.success && !context.result.text?.trim()) {
              return {
                  feedback: 'הסוכן החזיר תוצאות כלים אך ללא טקסט מסכם. הנתונים נמצאים בתוצאות הכלים — פרש אותם ישירות וכתוב תשובה מלאה.',
              };
          }
      },
  },
  ```

  **Import check:** No new imports needed — the types are inferred from `handleChatStream`'s generic parameter.

- [x] 2.2 Verify delegation hooks compile — `DelegationStartResult.modifiedMaxSteps` and `DelegationCompleteResult.feedback` are the correct field names (confirmed in research doc).

## 3. Incremental Delegation Instructions

> **Context:** The routing agent can call `tool-agent-datagovAgent` multiple times natively — each call is a standard tool call in its agentic loop. No framework changes needed, only instruction changes.

- [x] 3.1 Update routing agent instructions in `agents/network/routing/config.ts`

  Add a new section after the existing "כללי ניתוב" section:

  ```
  ========================
  🔄 האצלה הדרגתית (Incremental Delegation)
  ========================
  כשמאציל לסוכן משימה מורכבת, פצל אותה לשלבים ממוקדים:
  1. האצלה ראשונה: "חפש מאגרים על [נושא] ודווח מה מצאת"
  2. האצלה שנייה: "שלוף נתונים ממאגר [שם] וסכם את התוצאות"

  כל האצלה צריכה להיות משימה בודדת וממוקדת.
  אל תאציל את כל שאלת המשתמש בבת אחת — פצל לשלבים.
  הסוכנים מחזירים תוצאות טובות יותר כשהם מקבלים בקשות קצרות וספציפיות.
  ```

- [x] 3.2 Update DataGov agent instructions in `agents/network/datagov/config.ts`

  Add before the existing "דרישות" section:

  ```
  === מיקוד משימה ===
  כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית (למשל "רק חפש" או "רק שלוף ממאגר X").
  השלם את המשימה הספציפית שהתבקשת, כתוב סיכום טקסטואלי של מה שמצאת, וחזור.
  אל תנסה להשלים את כל שאלת המשתמש בעצמך — סוכן הניתוב יתאם המשך.
  ```

- [x] 3.3 Update CBS agent instructions in `agents/network/cbs/config.ts`

  Same pattern as 3.2 — add "מיקוד משימה" section before "דרישות".

## 4. Verification

- [x] 4.1 Run `tsc`, `npm run build`, `npm run lint` — fix any errors
- [ ] 4.2 Test with: "מה אחוז הדיוק של רכבת ישראל בחודשים האחרונים?"
  - Check debug logs: sub-agent `text` should be non-empty
  - Routing agent should produce Hebrew answer with actual datafix
- [ ] 4.3 Test with: "מה מדד המחירים לצרכן החודשי?" (CBS agent)
  - Same verification — non-empty sub-agent text
