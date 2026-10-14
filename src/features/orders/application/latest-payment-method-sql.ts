import { sql } from "drizzle-orm";

import { payments } from "@/db/schema/orders";

/**
 * Latest payment method for the current orders row.
 * `orders.id` must stay raw SQL: interpolating the column drops the table
 * name inside the subquery and compares payments.order_id to payments.id.
 */
export function latestPaymentMethodSql() {
  return sql<string | null>`
    (
      select ${payments.method}
      from ${payments}
      where ${payments.orderId} = orders.id
      order by ${payments.attemptNumber} desc
      limit 1
    )
  `;
}
