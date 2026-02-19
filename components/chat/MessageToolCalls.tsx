'use client';

import {useState} from 'react';
import {
    ActivityIcon,
    BarChart2Icon,
    BuildingIcon,
    DatabaseIcon,
    FileIcon,
    FileTextIcon,
    FolderIcon,
    LineChartIcon,
    LinkIcon,
    ListIcon,
    type LucideIcon,
    PieChartIcon,
    ScrollTextIcon,
    SearchIcon,
    ServerIcon,
    TagIcon,
} from 'lucide-react';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import {Shimmer} from '@/components/ai-elements/shimmer';
import {toolTranslations} from '@/constants/tool-translations';
import {AgentsDisplayMap} from '@/constants/agents-display';
import type {ToolName} from '@/lib/tools/types';
import type {StepStatus, ToolCallPart, ToolInfo} from './types';
import {getToolStatus} from './types';

/**
 * Map tool names to their LucideIcon components for ChainOfThoughtStep
 */
const toolIconMap: Partial<Record<ToolName, LucideIcon>> = {
    searchDatasets: SearchIcon,
    getDatasetDetails: FileTextIcon,
    listGroups: FolderIcon,
    listTags: TagIcon,
    queryDatastoreResource: DatabaseIcon,
    getDatasetActivity: ActivityIcon,
    getDatasetSchema: ScrollTextIcon,
    getOrganizationActivity: ActivityIcon,
    getOrganizationDetails: BuildingIcon,
    getResourceDetails: FileIcon,
    getStatus: ServerIcon,
    listAllDatasets: ListIcon,
    listLicenses: ScrollTextIcon,
    listOrganizations: BuildingIcon,
    searchResources: SearchIcon,
    displayBarChart: BarChart2Icon,
    displayLineChart: LineChartIcon,
    displayPieChart: PieChartIcon,
    browseCbsCatalog: DatabaseIcon,
    getCbsSeriesData: BarChart2Icon,
    browseCbsPriceIndices: LineChartIcon,
    getCbsPriceData: LineChartIcon,
    calculateCbsPriceIndex: ActivityIcon,
    searchCbsLocalities: SearchIcon,
    generateDataGovSourceUrl: LinkIcon,
    generateCbsSourceUrl: LinkIcon,
    'agent-datagovAgent': AgentsDisplayMap.datagovAgent.icon,
    'agent-cbsAgent': AgentsDisplayMap.cbsAgent.icon,
};

/**
 * Get tool info from translations
 */
export function getToolInfo(toolKey: string): ToolInfo {
    const meta = toolKey in toolTranslations ? toolTranslations[toolKey as ToolName] : null;
    const icon = (toolKey in toolIconMap ? toolIconMap[toolKey as ToolName] : undefined) ?? SearchIcon;
    return {
        name: meta?.name ?? toolKey,
        icon,
    };
}

/**
 * Format tool description for display
 */
export function getToolDescription(part: ToolCallPart): string | undefined {
    const toolKey = part.type.replace('tool-', '');
    const meta =
        toolKey in toolTranslations
            ? (toolTranslations[toolKey as ToolName] as
                  | { formatInput: (input: unknown) => string | undefined; formatOutput: (output: unknown) => string }
                  | undefined)
            : null;

    if (!meta) return undefined;

    try {
        if (part.state === 'output-available' && part.output !== undefined) {
            return meta.formatOutput(part.output);
        }

        if (part.input !== undefined) {
            return meta.formatInput(part.input);
        }
    } catch {
        return undefined;
    }

    return undefined;
}

type ToolIO = { input?: string; output?: string };

export function getToolIO(part: ToolCallPart): ToolIO | undefined {
    const toolKey = part.type.replace('tool-', '');
    const meta =
        toolKey in toolTranslations
            ? (toolTranslations[toolKey as ToolName] as
                  | { formatInput: (input: unknown) => string | undefined; formatOutput: (output: unknown) => string }
                  | undefined)
            : null;

    if (!meta) return undefined;

    try {
        const toolIO: ToolIO = {};
        if (part.state === 'output-available' && part.output !== undefined) {
            toolIO.output = meta.formatOutput(part.output);
        }

        if (part.input !== undefined) {
            toolIO.input = meta.formatInput(part.input);
        }

        return toolIO;
    } catch {
        return undefined;
    }
}

/**
 * Check if a tool call has an error — either AI SDK-level (state === 'output-error')
 * or business-level (output.success === false, e.g. API timeout).
 */
function isToolError(part: ToolCallPart): boolean {
    if (part.state === 'output-error') return true;
    if (part.state === 'output-available' && part.output != null) {
        const output = part.output as Record<string, unknown>;
        return output.success === false;
    }
    return false;
}

export interface MessageToolCallsProps {
    messageId: string;
    toolParts: Array<{ part: ToolCallPart; index: number }>;
    isProcessing: boolean;
    activeAgentLabel?: string;
}

/**
 * Component for rendering tool calls in a ChainOfThought timeline
 * Manages its own open state while auto-opening during processing
 * User can click header to toggle open/close
 */
export function MessageToolCalls({ messageId, toolParts, isProcessing, activeAgentLabel }: MessageToolCallsProps) {
    // User's preferred open state (can be toggled via header click)
    const [userWantsOpen, setUserWantsOpen] = useState(true);

    // Check if any tool is currently active
    const hasActiveTools = toolParts.some(({ part }) => getToolStatus(part.state) === 'active');

    // Handle user toggling
    const handleOpenChange = (open: boolean) => {
        setUserWantsOpen(open);
    };

    // Count errors (both SDK-level and business-level)
    const errorCount = toolParts.filter(({ part }) => isToolError(part)).length;
    const completedCount = toolParts.length - errorCount;

    const getHeaderContent = () => {
        if (hasActiveTools) {
            return (
                <Shimmer as='span' duration={1.5}>
                    {activeAgentLabel ?? 'מעבד...'}
                </Shimmer>
            );
        }

        if (errorCount > 0 && completedCount === 0) {
            return <span className='text-red-500'>{errorCount} פעולות נכשלו</span>;
        }

        if (errorCount > 0) {
            return (
                <span>
                    {completedCount} פעולות הושלמו
                    <span className='text-red-500 mr-1'> ({errorCount} שגיאות)</span>
                </span>
            );
        }

        return `${toolParts.length} פעולות הושלמו`;
    };

    return (
        <ChainOfThought open={userWantsOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>{getHeaderContent()}</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {toolParts.map(({ part, index }) => {
                    const toolKey = part.type.replace('tool-', '');
                    const { name, icon } = getToolInfo(toolKey);
                    const io = getToolIO(part);
                    const toolStatus: StepStatus = getToolStatus(part.state);
                    const hasError = isToolError(part);

                    return (
                        <ChainOfThoughtStep
                            key={`${messageId}-${index}`}
                            icon={icon}
                            label={
                                <span className={hasError ? 'text-red-500' : undefined}>
                                    {name}
                                    {toolStatus === 'active' && (
                                        <Shimmer as='span' className='mr-2 text-muted-foreground' duration={1.5}>
                                            ...
                                        </Shimmer>
                                    )}
                                </span>
                            }
                            description={
                                hasError ? (
                                    <span className='text-red-500'>
                                        {part.state === 'output-error' ? part.errorText : io?.output}
                                    </span>
                                ) : (
                                    <>
                                        {io?.input && <p className='text-muted-foreground'>{io.input}</p>}
                                        {io?.output && <p className='text-primary font-semibold'>{io?.output}</p>}
                                    </>
                                )
                            }
                            status={toolStatus}
                        />
                    );
                })}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
