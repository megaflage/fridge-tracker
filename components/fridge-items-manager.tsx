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
import { Trash2, Clock, Calendar, PackageOpen } from "lucide-react";

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
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Fridge Inventory
          </h1>
          <p className="text-lg text-muted-foreground">
            Track expiry dates. Reduce waste.
          </p>
        </div>

        {/* Add Item Form */}
        <Card className="border-2 border-border bg-card p-6 md:p-8">
          <form onSubmit={handleAddItem} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="item-name"
                  className="text-sm font-mono uppercase tracking-wider"
                >
                  Item Name
                </Label>
                <Input
                  id="item-name"
                  placeholder="Enter item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="border-2 bg-background font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="expiry-date"
                  className="text-sm font-mono uppercase tracking-wider"
                >
                  Expiry Date
                </Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="border-2 bg-background font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="opened-date"
                  className="text-sm font-mono uppercase tracking-wider"
                >
                  Opened Date (Optional)
                </Label>
                <Input
                  id="opened-date"
                  type="date"
                  value={openedDate}
                  onChange={(e) => setOpenedDate(e.target.value)}
                  className="border-2 bg-background font-mono"
                  placeholder="When was this opened?"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="use-within-days"
                  className="text-sm font-mono uppercase tracking-wider"
                >
                  Use Within Days (Optional)
                </Label>
                <Input
                  id="use-within-days"
                  type="number"
                  min="1"
                  value={useWithinDays}
                  onChange={(e) => setUseWithinDays(e.target.value)}
                  className="border-2 bg-background font-mono"
                  placeholder="e.g., 3, 5, 7 days"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Days to use within after opening
                </p>
              </div>
            </div>
            <Button
              type="submit"
              disabled={addItemMutation.isPending}
              className="w-full border-2 border-primary font-mono uppercase tracking-wider md:w-auto"
            >
              {addItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </Card>

        {/* Items List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-border pb-4">
            <h2 className="font-mono text-2xl font-bold uppercase tracking-wider">
              Items
            </h2>
            <span className="font-mono text-sm text-muted-foreground">
              {items.length} total
            </span>
          </div>

          {isLoading ? (
            <Card className="border-2 border-dashed border-border bg-card p-12">
              <div className="text-center">
                <p className="font-mono text-muted-foreground">Loading...</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="border-2 border-destructive bg-card p-12">
              <div className="text-center">
                <p className="font-mono text-destructive">
                  Error loading items. Please try again.
                </p>
              </div>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-card p-12">
              <div className="text-center">
                <p className="font-mono text-muted-foreground">
                  No items tracked yet
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
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

                return (
                  <Card
                    key={item.id}
                    className={`border-2 bg-card p-5 transition-all hover:border-foreground ${borderColor}`}
                  >
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-mono text-xl font-bold">
                            {item.name}
                          </h3>

                          {/* Expiry Info */}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="font-mono">
                                {expiryDateFormatted}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span
                                className={`font-mono font-bold uppercase tracking-wider ${
                                  status === "expired" || status === "critical"
                                    ? "text-destructive"
                                    : status === "warning"
                                    ? "text-orange-500"
                                    : "text-foreground"
                                }`}
                              >
                                {expiryLabel}
                              </span>
                            </div>
                            {item.openedDate && item.useWithinDays && (
                              <>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <PackageOpen className="h-4 w-4" />
                                  <span className="font-mono">
                                    Opened:{" "}
                                    {new Date(
                                      item.openedDate
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                {useByDateFormatted && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span
                                      className={`font-mono font-bold uppercase tracking-wider ${
                                        useByStatus === "expired" ||
                                        useByStatus === "critical"
                                          ? "text-destructive"
                                          : useByStatus === "warning"
                                          ? "text-orange-500"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {useByLabel}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                          <Badge
                            variant={eatenConfig.badgeVariant}
                            className="font-mono text-xs uppercase tracking-wider"
                          >
                            {eatenConfig.label}
                          </Badge>
                          {useByStatus && (
                            <Badge
                              variant={
                                useByStatus === "expired" ||
                                useByStatus === "critical"
                                  ? "destructive"
                                  : useByStatus === "warning"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={`font-mono text-xs uppercase tracking-wider ${
                                useByStatus === "expired" ||
                                useByStatus === "critical"
                                  ? "border-destructive"
                                  : ""
                              }`}
                            >
                              {useByStatus === "expired"
                                ? "Use-by Passed"
                                : useByStatus === "critical"
                                ? "Use-by Today/Tomorrow"
                                : useByStatus === "warning"
                                ? "Use-by Soon"
                                : ""}
                            </Badge>
                          )}
                          {item.openedDate && !item.useWithinDays && (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs uppercase tracking-wider"
                            >
                              Opened
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">Eaten Status</span>
                          <span className="font-mono">
                            {eatenConfig.progress}%
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                          <div
                            className={`h-full transition-all ${eatenConfig.color}`}
                            style={{ width: `${eatenConfig.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-border">
                        <div className="flex items-center justify-between gap-3">
                          <Select
                            value={item.eatenStatus}
                            onValueChange={(value: FridgeItem["eatenStatus"]) =>
                              updateItemMutation.mutate({
                                id: item.id,
                                eatenStatus: value,
                              })
                            }
                            disabled={updateItemMutation.isPending}
                          >
                            <SelectTrigger className="w-[160px] font-mono text-sm">
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

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            disabled={isDeleting(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Opened Date Controls */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
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
                              className="h-8 border-2 bg-background font-mono text-xs w-[140px]"
                              placeholder="Not opened"
                            />
                          </div>
                          {item.openedDate && (
                            <div className="flex items-center gap-2">
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
                                className="h-8 border-2 bg-background font-mono text-xs w-[80px]"
                                placeholder="Days"
                              />
                              <span className="font-mono text-xs text-muted-foreground">
                                days
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
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
