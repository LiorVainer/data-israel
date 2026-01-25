'use client';

import { CheckIcon } from 'lucide-react';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector';
import { PromptInputButton } from '@/components/ai-elements/prompt-input';
import { AgentConfig } from '@/agents/agent.config';

export interface ModelSelectorSectionProps {
  selectedModel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelectorSection({
  selectedModel,
  open,
  onOpenChange,
  onSelectModel,
}: ModelSelectorSectionProps) {
  const selectedModelData = AgentConfig.AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel
  );

  // Group models by provider
  const providers = Array.from(
    new Set(AgentConfig.AVAILABLE_MODELS.map((m) => m.provider))
  );

  return (
    <ModelSelector open={open} onOpenChange={onOpenChange}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton className="gap-2">
          {selectedModelData?.providerSlug && (
            <ModelSelectorLogo provider={selectedModelData.providerSlug} />
          )}
          <ModelSelectorName className="hidden sm:inline">
            {selectedModelData?.name}
          </ModelSelectorName>
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="חפש מודל..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>לא נמצאו מודלים</ModelSelectorEmpty>
          {providers.map((provider) => (
            <ModelSelectorGroup key={provider} heading={provider}>
              {AgentConfig.AVAILABLE_MODELS.filter(
                (m) => m.provider === provider
              ).map((m) => (
                <ModelSelectorItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => {
                    onSelectModel(m.id);
                    onOpenChange(false);
                  }}
                >
                  <ModelSelectorLogo provider={m.providerSlug} />
                  <ModelSelectorName>{m.name}</ModelSelectorName>
                  {selectedModel === m.id ? (
                    <CheckIcon className="mr-auto size-4" />
                  ) : (
                    <div className="mr-auto size-4" />
                  )}
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
