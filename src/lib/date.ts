import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Formats a Convex _creationTime timestamp to a Hebrew relative time string.
 * Example: "לפני 3 דקות", "לפני שעה", "לפני 2 ימים"
 *
 * @param timestamp - Convex _creationTime (milliseconds since epoch)
 */
export function formatCreationTime(timestamp: number): string {
    return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: he,
    });
}
