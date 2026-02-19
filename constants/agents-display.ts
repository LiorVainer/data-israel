/**
 * Agent Display Configuration
 *
 * Type-safe display metadata for each agent in the network.
 * Uses Record<AgentName, ...> to enforce completeness at compile time.
 */

import { ActivityIcon, BarChart2Icon, DatabaseIcon, type LucideIcon } from 'lucide-react';
import type { AgentName } from '@/agents/types';
import type { DataSource } from '@/constants/tool-data-sources';

export interface AgentDisplayInfo {
    label: string;
    icon: LucideIcon;
    /** Data source for badge display — only for data-fetching agents */
    dataSource?: DataSource;
}

export const AgentsDisplayMap: Record<AgentName, AgentDisplayInfo> = {
    datagovAgent: { label: 'בודק במאגרי המידע הממשלתי', icon: DatabaseIcon, dataSource: 'datagov' },
    cbsAgent: { label: 'בודק בנתוני הלשכה המרכזית לסטטיסטיקה', icon: BarChart2Icon, dataSource: 'cbs' },
    routingAgent: { label: 'סוכן הניתוב', icon: ActivityIcon },
};
