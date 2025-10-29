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
import { Trash2, Clock, Calendar } from "lucide-react";

interface FridgeItem {
  id: number;
  name: string;
  expiryDate: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: "joe" | "lydia";
  eatenStatus: "fresh" | "half eaten" | "nearly eaten" | "eaten";
}

export function FridgeItemsManager() {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

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
    mutationFn: async (item: { name: string; expiryDate: string }) => {
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
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      eatenStatus,
    }: {
      id: number;
      eatenStatus: "fresh" | "half eaten" | "nearly eaten" | "eaten";
    }) => {
      const result = await updateItem(id, { eatenStatus });
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

                return (
                  <Card
                    key={item.id}
                    className={`border-2 bg-card p-5 transition-all hover:border-foreground ${
                      status === "expired" || status === "critical"
                        ? "border-destructive"
                        : status === "warning"
                        ? "border-muted-foreground"
                        : "border-border"
                    }`}
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
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant={eatenConfig.badgeVariant}
                          className="font-mono text-xs uppercase tracking-wider"
                        >
                          {eatenConfig.label}
                        </Badge>
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
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
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
