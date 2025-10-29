"use client";

import type React from "react";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getItems, addItem } from "@/app/actions/fridge-items";

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

                return (
                  <Card
                    key={item.id}
                    className={`border-2 bg-card p-4 transition-all hover:border-foreground ${
                      status === "expired" || status === "critical"
                        ? "border-destructive"
                        : status === "warning"
                        ? "border-muted-foreground"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-mono text-xl font-bold">
                          {item.name}
                        </h3>
                        <p className="font-mono text-sm text-muted-foreground">
                          {expiryDateFormatted}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold uppercase tracking-wider">
                            {daysUntilExpiry < 0
                              ? `Expired ${Math.abs(daysUntilExpiry)}d ago`
                              : daysUntilExpiry === 0
                              ? "Expires today"
                              : `${daysUntilExpiry}d remaining`}
                          </p>
                        </div>
                        <div
                          className={`h-3 w-3 rounded-full ${
                            status === "expired"
                              ? "bg-destructive"
                              : status === "critical"
                              ? "bg-destructive"
                              : status === "warning"
                              ? "bg-muted-foreground"
                              : "bg-foreground"
                          }`}
                        />
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
