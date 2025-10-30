"use client";

import type React from "react";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getItems,
  addItem,
  deleteItem,
  updateItem,
} from "@/app/actions/fridge-items";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FridgeItem {
  id: number;
  name: string;
  expiryDate: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: "joe" | "lydia";
  eatenStatus: "fresh" | "half eaten" | "nearly eaten" | "eaten";
  openedDate: string | null;
  useWithinDays: number | null;
}

export function FridgeItemsManager() {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [useWithinDays, setUseWithinDays] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<FridgeItem[]>({
    queryKey: ["fridge-items"],
    queryFn: async () => {
      const result = await getItems();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch items");
      }
      return result.data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: {
      name: string;
      expiryDate: string;
      openedDate?: string;
      useWithinDays?: number;
    }) => {
      const result = await addItem(item);
      if (!result.success) {
        throw new Error(result.error || "Failed to add item");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fridge-items"] });
      setItemName("");
      setExpiryDate("");
      setOpenedDate("");
      setUseWithinDays("");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      eatenStatus,
      openedDate,
      useWithinDays,
    }: {
      id: number;
      eatenStatus?: "fresh" | "half eaten" | "nearly eaten" | "eaten";
      openedDate?: string | null;
      useWithinDays?: number | null;
    }) => {
      const result = await updateItem(id, {
        ...(eatenStatus !== undefined && { eatenStatus }),
        ...(openedDate !== undefined && { openedDate }),
        ...(useWithinDays !== undefined && { useWithinDays }),
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to update item");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fridge-items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteItem(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete item");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fridge-items"] });
    },
  });

  const isDeleting = (id: number) => {
    return deleteItemMutation.isPending && deleteItemMutation.variables === id;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName && expiryDate) {
      addItemMutation.mutate({
        name: itemName,
        expiryDate: expiryDate,
        openedDate: openedDate || undefined,
        useWithinDays: useWithinDays ? parseInt(useWithinDays, 10) : undefined,
      });
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUseByDate = (
    openedDate: string | null,
    useWithinDays: number | null
  ) => {
    if (!openedDate || !useWithinDays) return null;
    const opened = new Date(openedDate);
    const useBy = new Date(opened);
    useBy.setDate(useBy.getDate() + useWithinDays);
    return useBy;
  };

  const getDaysUntilUseBy = (
    openedDate: string | null,
    useWithinDays: number | null
  ) => {
    const useByDate = getUseByDate(openedDate, useWithinDays);
    if (!useByDate) return null;
    const today = new Date();
    const diffTime = useByDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 3) return "critical";
    if (daysUntilExpiry <= 7) return "warning";
    return "fresh";
  };

  const getEatenStatusConfig = (status: FridgeItem["eatenStatus"]) => {
    switch (status) {
      case "fresh":
        return {
          label: "Fresh",
          progress: 0,
          color: "bg-green-500",
          badgeVariant: "default" as const,
        };
      case "half eaten":
        return {
          label: "Half Eaten",
          progress: 50,
          color: "bg-yellow-500",
          badgeVariant: "secondary" as const,
        };
      case "nearly eaten":
        return {
          label: "Nearly Eaten",
          progress: 90,
          color: "bg-orange-500",
          badgeVariant: "outline" as const,
        };
      case "eaten":
        return {
          label: "Eaten",
          progress: 100,
          color: "bg-gray-500",
          badgeVariant: "outline" as const,
        };
      default:
        return {
          label: "Fresh",
          progress: 0,
          color: "bg-green-500",
          badgeVariant: "default" as const,
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:space-y-6 md:p-8">
        {/* Header */}
        <div className="space-y-1 pb-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            Fridge Inventory
          </h1>
          <p className="text-xs text-muted-foreground">
            Track expiry dates. Reduce waste.
          </p>
        </div>

        {/* Add Item Form */}
        <Card className="border border-border bg-card shadow-sm p-4 md:p-6">
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="item-name"
                  className="text-xs font-mono uppercase tracking-wider"
                >
                  Item Name
                </Label>
                <Input
                  id="item-name"
                  placeholder="Enter item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="border bg-background font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="expiry-date"
                  className="text-xs font-mono uppercase tracking-wider"
                >
                  Expiry Date
                </Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="border bg-background font-mono"
                  required
                />
              </div>
            </div>

            <Collapsible
              open={showOptionalFields}
              onOpenChange={setShowOptionalFields}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs font-mono text-muted-foreground hover:text-foreground -ml-2 h-8"
                >
                  {showOptionalFields ? (
                    <>
                      Hide optional fields{" "}
                      <ChevronUp className="ml-1 h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Show optional fields{" "}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="opened-date"
                      className="text-xs font-mono uppercase tracking-wider"
                    >
                      Opened Date
                    </Label>
                    <Input
                      id="opened-date"
                      type="date"
                      value={openedDate}
                      onChange={(e) => setOpenedDate(e.target.value)}
                      className="border bg-background font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="use-within-days"
                      className="text-xs font-mono uppercase tracking-wider"
                    >
                      Use Within Days
                    </Label>
                    <Input
                      id="use-within-days"
                      type="number"
                      min="1"
                      value={useWithinDays}
                      onChange={(e) => setUseWithinDays(e.target.value)}
                      className="border bg-background font-mono"
                      placeholder="e.g., 3, 5, 7"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              type="submit"
              disabled={addItemMutation.isPending}
              className="w-full font-mono uppercase tracking-wider text-sm"
            >
              {addItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </Card>

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-mono text-lg font-semibold uppercase tracking-wider">
              Items
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>

          {isLoading ? (
            <Card className="border border-dashed border-border bg-card p-8 md:p-12 shadow-sm">
              <div className="text-center">
                <p className="font-mono text-sm text-muted-foreground md:text-base">
                  Loading...
                </p>
              </div>
            </Card>
          ) : error ? (
            <Card className="border border-destructive bg-card p-8 md:p-12 shadow-sm">
              <div className="text-center">
                <p className="font-mono text-sm text-destructive md:text-base">
                  Error loading items. Please try again.
                </p>
              </div>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border border-dashed border-border bg-card p-8 md:p-12 shadow-sm">
              <div className="text-center">
                <p className="font-mono text-sm text-muted-foreground md:text-base">
                  No items tracked yet
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {items.map((item) => {
                const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                const status = getExpiryStatus(daysUntilExpiry);
                const expiryDateFormatted = new Date(
                  item.expiryDate
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const eatenConfig = getEatenStatusConfig(item.eatenStatus);
                const expiryLabel =
                  daysUntilExpiry < 0
                    ? `Expired ${Math.abs(daysUntilExpiry)}d ago`
                    : daysUntilExpiry === 0
                    ? "Expires today"
                    : `${daysUntilExpiry}d remaining`;

                // Use-by date calculations
                const daysUntilUseBy = getDaysUntilUseBy(
                  item.openedDate,
                  item.useWithinDays
                );
                const useByDate = getUseByDate(
                  item.openedDate,
                  item.useWithinDays
                );
                const useByDateFormatted = useByDate
                  ? useByDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                const getUseByStatus = (days: number | null) => {
                  if (days === null) return null;
                  if (days < 0) return "expired";
                  if (days <= 1) return "critical";
                  if (days <= 3) return "warning";
                  return "fresh";
                };

                const useByStatus = getUseByStatus(daysUntilUseBy);
                const useByLabel =
                  daysUntilUseBy === null
                    ? null
                    : daysUntilUseBy < 0
                    ? `Use-by passed ${Math.abs(daysUntilUseBy)}d ago`
                    : daysUntilUseBy === 0
                    ? "Use by today"
                    : `${daysUntilUseBy}d until use-by`;

                // Determine border color based on both expiry and use-by status
                const borderColor =
                  status === "expired" ||
                  status === "critical" ||
                  useByStatus === "expired" ||
                  useByStatus === "critical"
                    ? "border-destructive"
                    : status === "warning" || useByStatus === "warning"
                    ? "border-orange-500"
                    : "border-border";

                const isExpanded = expandedItems.has(item.id);

                return (
                  <Card
                    key={item.id}
                    className={`border bg-card p-3 shadow-sm transition-all hover:shadow ${borderColor}`}
                  >
                    <div className="space-y-2">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono text-base font-semibold">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">
                              {expiryDateFormatted}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span
                              className={`font-mono font-medium ${
                                status === "expired" || status === "critical"
                                  ? "text-destructive"
                                  : status === "warning"
                                  ? "text-orange-500"
                                  : ""
                              }`}
                            >
                              {expiryLabel}
                            </span>
                            {item.openedDate &&
                              item.useWithinDays &&
                              useByLabel && (
                                <>
                                  <span className="text-muted-foreground">
                                    •
                                  </span>
                                  <span
                                    className={`font-mono font-medium ${
                                      useByStatus === "expired" ||
                                      useByStatus === "critical"
                                        ? "text-destructive"
                                        : useByStatus === "warning"
                                        ? "text-orange-500"
                                        : ""
                                    }`}
                                  >
                                    {useByLabel}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={eatenConfig.badgeVariant}
                            className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5"
                          >
                            {eatenConfig.label}
                          </Badge>
                          {(useByStatus === "expired" ||
                            useByStatus === "critical" ||
                            useByStatus === "warning") && (
                            <Badge
                              variant={
                                useByStatus === "expired" ||
                                useByStatus === "critical"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5"
                            >
                              Use-by{" "}
                              {useByStatus === "expired"
                                ? "Passed"
                                : useByStatus === "critical"
                                ? "Due"
                                : "Soon"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Controls Row */}
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newSet = new Set(expandedItems);
                          if (open) {
                            newSet.add(item.id);
                          } else {
                            newSet.delete(item.id);
                          }
                          setExpandedItems(newSet);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 flex-1">
                            <Select
                              value={item.eatenStatus}
                              onValueChange={(
                                value: FridgeItem["eatenStatus"]
                              ) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  eatenStatus: value,
                                })
                              }
                              disabled={updateItemMutation.isPending}
                            >
                              <SelectTrigger className="w-[140px] font-mono text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fresh">Fresh</SelectItem>
                                <SelectItem value="half eaten">
                                  Half Eaten
                                </SelectItem>
                                <SelectItem value="nearly eaten">
                                  Nearly Eaten
                                </SelectItem>
                                <SelectItem value="eaten">Eaten</SelectItem>
                              </SelectContent>
                            </Select>

                            <CollapsibleTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? (
                                  <>
                                    Less <ChevronUp className="ml-1 h-3 w-3" />
                                  </>
                                ) : (
                                  <>
                                    More{" "}
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                  </>
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            disabled={isDeleting(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <CollapsibleContent className="pt-2 space-y-2">
                          <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                            <Label
                              htmlFor={`opened-date-${item.id}`}
                              className="font-mono text-xs text-muted-foreground whitespace-nowrap"
                            >
                              Opened:
                            </Label>
                            <Input
                              id={`opened-date-${item.id}`}
                              type="date"
                              value={item.openedDate || ""}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  openedDate: e.target.value || null,
                                })
                              }
                              className="h-8 border bg-background font-mono text-xs"
                              placeholder="Not opened"
                            />
                          </div>
                          {item.openedDate && (
                            <div className="grid grid-cols-[90px_80px_auto] gap-2 items-center">
                              <Label
                                htmlFor={`use-within-${item.id}`}
                                className="font-mono text-xs text-muted-foreground whitespace-nowrap"
                              >
                                Use within:
                              </Label>
                              <Input
                                id={`use-within-${item.id}`}
                                type="number"
                                min="1"
                                value={item.useWithinDays || ""}
                                onChange={(e) =>
                                  updateItemMutation.mutate({
                                    id: item.id,
                                    useWithinDays: e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : null,
                                  })
                                }
                                className="h-8 border bg-background font-mono text-xs"
                                placeholder="Days"
                              />
                              <span className="font-mono text-xs text-muted-foreground">
                                days
                              </span>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
