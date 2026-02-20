/**
 * ORM instance for better-convex.
 *
 * Provides typed database access via `createOrm` and a `withOrm` helper
 * that extends query/mutation contexts with an `orm` property.
 */

import { createOrm } from 'better-convex/orm';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { relations } from '../schema';

/**
 * ORM client instance backed by the relations config from schema.ts.
 * Use `orm.db(ctx)` to get a typed ORM handle inside any Convex function.
 */
export const orm = createOrm({ schema: relations });

/**
 * Extends a Convex query or mutation context with an `orm` property.
 *
 * @example
 * ```ts
 * const myQuery = publicQuery.query(async ({ ctx }) => {
 *   // ctx.orm is available via withOrm in the cRPC context config
 *   const users = await ctx.orm.query.users.findMany();
 *   return users;
 * });
 * ```
 */
export const withOrm = <Ctx extends QueryCtx | MutationCtx>(ctx: Ctx) => ({
    ...ctx,
    orm: orm.db(ctx),
});
