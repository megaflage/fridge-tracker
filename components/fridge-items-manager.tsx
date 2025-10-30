"use client";

import type React from "react";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Plus,
  PackageOpen,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  daysUntilExpiry: number;
  daysUntilUseBy: number | null;
}

export function FridgeItemsManager() {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isOpened, setIsOpened] = useState(false);
  const [useWithinDays, setUseWithinDays] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
    // Refetch every hour to get updated day calculations from server
    refetchInterval: 60 * 60 * 1000, // 1 hour in milliseconds
    // Also refetch on window focus to ensure data is fresh
    refetchOnWindowFocus: true,
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
      setIsOpened(false);
      setUseWithinDays(null);
      setIsAddDialogOpen(false);
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
      const today = new Date().toISOString().split("T")[0];
      addItemMutation.mutate({
        name: itemName,
        expiryDate: expiryDate,
        openedDate: isOpened ? today : undefined,
        useWithinDays: useWithinDays || undefined,
      });
    }
  };

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry === 0) return "expires-today";
    if (daysUntilExpiry <= 3) return "warning";
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
    <div className="min-h-screen">
      I
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:space-y-6 md:p-8 pb-8 md:pb-12">
        {/* Header */}
        <div className="flex items-start justify-between pb-3">
          <div className="space-y-1">
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              Fridge Inventory
            </h1>
            <p className="text-xs text-muted-foreground">
              Track expiry dates. Reduce waste.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="font-mono uppercase tracking-wider shrink-0"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-mono">Add New Item</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  Track a new item in your fridge inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-3">
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

                {/* Opened Toggle - Simple and Clear */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PackageOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="opened-toggle"
                          className="font-mono text-sm font-semibold cursor-pointer"
                        >
                          Already Opened?
                        </Label>
                        <p className="text-xs text-muted-foreground font-mono">
                          Mark if you've opened this item
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="opened-toggle"
                      checked={isOpened}
                      onCheckedChange={setIsOpened}
                    />
                  </div>

                  {/* Use Within Days - Only show if opened */}
                  {isOpened && (
                    <div className="space-y-2 pl-8">
                      <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Use Within
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[3, 5, 7, 10].map((days) => (
                          <Button
                            key={days}
                            type="button"
                            variant={
                              useWithinDays === days ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setUseWithinDays(
                                useWithinDays === days ? null : days
                              )
                            }
                            className="font-mono text-sm"
                          >
                            {days} days
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={addItemMutation.isPending}
                  className="w-full font-mono uppercase tracking-wider text-sm"
                >
                  {addItemMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
            <Card className="border border-dashed border-border bg-white dark:bg-card p-8 md:p-12 shadow-lg">
              <div className="text-center">
                <p className="font-mono text-sm text-muted-foreground md:text-base">
                  Loading...
                </p>
              </div>
            </Card>
          ) : error ? (
            <Card className="border border-destructive bg-white dark:bg-card p-8 md:p-12 shadow-lg">
              <div className="text-center">
                <p className="font-mono text-sm text-destructive md:text-base">
                  Error loading items. Please try again.
                </p>
              </div>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border border-dashed border-border bg-white dark:bg-card p-8 md:p-12 shadow-lg">
              <div className="text-center">
                <p className="font-mono text-sm text-muted-foreground md:text-base">
                  No items tracked yet
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4 md:space-y-4">
              {[...items]
                .sort((a, b) => {
                  // Get the most urgent date for each item (expiry or use-by, whichever is sooner)
                  const getUrgentDays = (item: FridgeItem) => {
                    const expiryDays = item.daysUntilExpiry;
                    const useByDays = item.daysUntilUseBy;

                    // If expiry is expired or expires today, always prioritize expiry
                    if (expiryDays <= 0) {
                      return expiryDays;
                    }

                    // Otherwise, if use-by exists and is sooner than expiry, use it
                    if (useByDays !== null && useByDays < expiryDays) {
                      return useByDays;
                    }

                    // Otherwise use expiry
                    return expiryDays;
                  };

                  const aUrgent = getUrgentDays(a);
                  const bUrgent = getUrgentDays(b);

                  // Sort by most urgent first (lowest number first)
                  return aUrgent - bUrgent;
                })
                .map((item) => {
                  // Use server-calculated values
                  const daysUntilExpiry = item.daysUntilExpiry;
                  const daysUntilUseBy = item.daysUntilUseBy;
                  const status = getExpiryStatus(daysUntilExpiry);
                  const expiryDateFormatted = new Date(
                    item.expiryDate
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  const eatenConfig = getEatenStatusConfig(item.eatenStatus);
                  const expiryLabel =
                    daysUntilExpiry < 0
                      ? `Expired ${Math.abs(daysUntilExpiry)}d ago`
                      : daysUntilExpiry === 0
                      ? "Expires today"
                      : `Expires in ${daysUntilExpiry}d`;

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
                      ? `Use by: ${Math.abs(daysUntilUseBy)}d overdue`
                      : daysUntilUseBy === 0
                      ? "Use by: Today"
                      : `Use within ${daysUntilUseBy}d`;

                  // Determine border and background color based on both expiry and use-by status
                  const isUrgent =
                    status === "expired" ||
                    useByStatus === "expired" ||
                    useByStatus === "critical";
                  const isWarning =
                    status === "warning" ||
                    status === "expires-today" ||
                    useByStatus === "warning";

                  const borderColor = "border-border";

                  const bgColor = "bg-white dark:bg-card";

                  const isExpanded = expandedItems.has(item.id);

                  return (
                    <Card
                      key={item.id}
                      className={`${borderColor} ${bgColor} p-4 md:p-5 shadow-lg transition-all`}
                    >
                      <div className="space-y-3">
                        {/* Main Item Display - Large and Glanceable */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-mono text-3xl md:text-4xl font-bold mb-2 break-words">
                              {item.name}
                            </h3>

                            {/* Status Indicators - Large and Clear */}
                            <div className="flex flex-col gap-2 mb-2">
                              {/* Expiry Status */}
                              <div className="flex items-center gap-2">
                                {status === "expired" && (
                                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                )}
                                {status === "expires-today" && (
                                  <span className="text-orange-500 shrink-0">
                                    ⚠️
                                  </span>
                                )}
                                {status === "warning" && (
                                  <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                                )}
                                {status === "fresh" && (
                                  <Clock className="h-5 w-5 text-green-500 shrink-0" />
                                )}
                                <span
                                  className={`font-mono text-lg md:text-xl font-semibold ${
                                    status === "expired"
                                      ? "text-destructive"
                                      : status === "expires-today" ||
                                        status === "warning"
                                      ? "text-orange-500"
                                      : status === "fresh"
                                      ? "text-green-600 dark:text-green-500"
                                      : "text-foreground"
                                  }`}
                                >
                                  {expiryLabel}
                                </span>
                              </div>

                              {/* Use-by Status if applicable */}
                              {useByLabel && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono text-base md:text-lg font-semibold ${
                                      useByStatus === "expired" ||
                                      useByStatus === "critical"
                                        ? "text-destructive"
                                        : useByStatus === "warning"
                                        ? "text-orange-500"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {useByLabel}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Date Display - Subtle */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-mono">
                                {expiryDateFormatted}
                              </span>
                            </div>
                          </div>

                          {/* Badge Stack - Top Right */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge
                              variant={eatenConfig.badgeVariant}
                              className={`font-mono text-xs md:text-sm uppercase tracking-wider px-3 py-1.5 ${
                                item.eatenStatus === "eaten" ? "opacity-60" : ""
                              }`}
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
                                className="font-mono text-xs md:text-sm uppercase tracking-wider px-3 py-1.5 border-2"
                              >
                                {useByStatus === "expired"
                                  ? "⚠️ Expired"
                                  : useByStatus === "critical"
                                  ? "🚨 Due Now"
                                  : "⏰ Soon"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Controls Row - Simplified */}
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
                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
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
                                <SelectTrigger className="w-[140px] md:w-[160px] font-mono text-sm h-10">
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
                                  className="h-10 px-3 font-mono text-sm text-muted-foreground hover:text-foreground"
                                >
                                  {isExpanded ? (
                                    <>
                                      Less{" "}
                                      <ChevronUp className="ml-1 h-4 w-4" />
                                    </>
                                  ) : (
                                    <>
                                      More{" "}
                                      <ChevronDown className="ml-1 h-4 w-4" />
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
                              className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>

                          <CollapsibleContent className="pt-4 space-y-4">
                            {/* Opened Toggle - Simple Button */}
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                              <div className="flex items-center gap-3">
                                <PackageOpen className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <Label className="font-mono text-sm font-semibold">
                                    Open Status
                                  </Label>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {item.openedDate ? "Opened" : "Not opened"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant={
                                  item.openedDate ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  const today = new Date()
                                    .toISOString()
                                    .split("T")[0];
                                  updateItemMutation.mutate({
                                    id: item.id,
                                    openedDate: item.openedDate ? null : today,
                                    // Clear use within days if unopening
                                    useWithinDays: item.openedDate
                                      ? null
                                      : item.useWithinDays,
                                  });
                                }}
                                disabled={updateItemMutation.isPending}
                                className="font-mono text-sm"
                              >
                                {item.openedDate
                                  ? "Mark Closed"
                                  : "Mark Opened"}
                              </Button>
                            </div>

                            {/* Use Within Days - Only show if opened */}
                            {item.openedDate && (
                              <div className="space-y-2">
                                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                  Use Within
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {[3, 5, 7, 10].map((days) => (
                                    <Button
                                      key={days}
                                      type="button"
                                      variant={
                                        item.useWithinDays === days
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        updateItemMutation.mutate({
                                          id: item.id,
                                          useWithinDays:
                                            item.useWithinDays === days
                                              ? null
                                              : days,
                                        })
                                      }
                                      disabled={updateItemMutation.isPending}
                                      className="font-mono text-sm"
                                    >
                                      {days} days
                                    </Button>
                                  ))}
                                </div>
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
