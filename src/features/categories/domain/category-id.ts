import { z } from "zod";

/**
 * Category primary keys are text: UUIDv7 for admin-created rows, or imported
 * marco.am CUID source ids. Do not require UUID.
 */
export const categoryIdSchema = z.string().trim().min(1).max(64);
