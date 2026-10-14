"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ConfirmDialog,
} from "@/components/ui/ConfirmDialog";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TD_METRIC,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_TH_METRIC,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  formatAdminMessage,
  getAdminCopy,
} from "@/features/admin/ui/get-admin-copy";
import { bulkArchiveOrdersAction } from "@/features/orders/application/bulk-archive-orders";
import { paymentMethodLabel } from "@/features/orders/domain/payment-method-label";
import { AdminInlineStatusSelect } from "@/features/orders/ui/AdminInlineStatusSelect";

type BulkOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  contactName: string;
  contactEmail: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  isArchived: boolean;
  paymentMethod: string | null;
};

type BulkChangeOrderStatusFormProps = {
  locale: string;
  orders: BulkOrderRow[];
  onOpenOrder: (orderNumber: string) => void;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

export function BulkChangeOrderStatusForm({
  locale,
  orders,
  onOpenOrder,
}: BulkChangeOrderStatusFormProps) {
  const router = useRouter();
  const copy = getAdminCopy(locale).orders;
  const common = getAdminCopy(locale).common;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allNumbers = orders.map((order) => order.orderNumber);
  const allSelected =
    allNumbers.length > 0 && allNumbers.every((n) => selected.has(n));

  function toggleOne(orderNumber: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderNumber)) {
        next.delete(orderNumber);
      } else {
        next.add(orderNumber);
      }
      return next;
    });
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(allNumbers));
  }

  function deleteSelected(): void {
    if (selected.size === 0) {
      setError(copy.selectAtLeastOne);
      return;
    }
    setConfirmOpen(true);
  }

  function confirmDelete(): void {
    const orderNumbers = [...selected];
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await bulkArchiveOrdersAction(locale, {
        orderNumbers,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setMessage(
        formatAdminMessage(copy.deletedSummary, {
          archived: result.value.archived,
          skipped: result.value.skipped,
        }),
      );
      setSelected(new Set());
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-gray-700">
          {formatAdminMessage(
            selected.size === 1 ? copy.selectedOne : copy.selected,
            { count: selected.size },
          )}
        </p>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={isPending || selected.size === 0}
          onClick={deleteSelected}
        >
          {isPending ? copy.deleting : copy.deleteSelected}
        </Button>
        {error ? (
          <p className="w-full text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="w-full text-sm text-green-700">{message}</p>
        ) : null}
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH_CHECK}>
                  <input
                    type="checkbox"
                    className={ADMIN_TABLE_CHECKBOX}
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={isPending || orders.length === 0}
                    aria-label={copy.selectAll}
                  />
                </th>
                <th className={ADMIN_TABLE_TH}>{copy.columnOrder}</th>
                <th className={ADMIN_TABLE_TH}>{copy.columnCustomer}</th>
                <th className={ADMIN_TABLE_TH_METRIC}>{copy.columnStatus}</th>
                <th className={ADMIN_TABLE_TH_METRIC}>{copy.columnPayment}</th>
                <th className={ADMIN_TABLE_TH_METRIC}>{copy.columnTotal}</th>
                <th className={ADMIN_TABLE_TH_METRIC}>{copy.columnMethod}</th>
                <th className={ADMIN_TABLE_TH}>{copy.columnPlaced}</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`${ADMIN_TABLE_ROW} cursor-pointer`}
                  tabIndex={0}
                  role="button"
                  aria-label={formatAdminMessage(copy.openOrder, {
                    number: order.orderNumber,
                  })}
                  onClick={() => onOpenOrder(order.orderNumber)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenOrder(order.orderNumber);
                    }
                  }}
                >
                  <td
                    className={ADMIN_TABLE_TD_CHECK}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={selected.has(order.orderNumber)}
                      onChange={() => toggleOne(order.orderNumber)}
                      disabled={isPending || order.isArchived}
                      aria-label={formatAdminMessage(common.selectAria, {
                        name: order.orderNumber,
                      })}
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                    {order.isArchived ? (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                        {copy.archived}
                      </span>
                    ) : null}
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <p className="text-sm text-gray-900">{order.contactName}</p>
                    <p className="text-xs text-gray-500">{order.contactEmail}</p>
                  </td>
                  <td
                    className={ADMIN_TABLE_TD_METRIC}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <AdminInlineStatusSelect
                      locale={locale}
                      orderNumber={order.orderNumber}
                      kind="order"
                      value={order.status}
                      disabled={isPending || order.isArchived}
                    />
                  </td>
                  <td
                    className={ADMIN_TABLE_TD_METRIC}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <AdminInlineStatusSelect
                      locale={locale}
                      orderNumber={order.orderNumber}
                      kind="payment"
                      value={order.paymentStatus}
                      disabled={isPending || order.isArchived}
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD_METRIC}>
                    <span className="font-medium text-gray-900">
                      {formatMoney(order.totalAmount, order.baseCurrency)}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD_METRIC}>
                    {paymentMethodLabel(order.paymentMethod)}
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="text-xs text-gray-500">
                      {new Date(order.placedAt)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}{" "}
                      {common.utc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {copy.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_FOOTER_ROUNDED_B}>
            <p className="text-sm text-gray-600">
              {formatAdminMessage(copy.selectedOnPage, { count: selected.size })}
            </p>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={common.delete}
        confirmLabel={common.delete}
        cancelLabel={common.cancel}
        description={formatAdminMessage(common.deleteConfirm, {
          entity: copy.entity,
          name: [...selected].join(", "),
        })}
        isPending={isPending}
        onClose={() => {
          if (!isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
