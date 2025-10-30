"use server";

import { getFridgeItems, addFridgeItem, removeFridgeItem, updateFridgeItem } from "@/lib/dbAdd";
import { InsertFridgeItem } from "@/app/src/db/schema";

export async function getItems() {
  try {
    const items = await getFridgeItems();
    
    // Calculate days until expiry and use-by on the server
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const itemsWithCalculations = items.map((item) => {
      // Calculate days until expiry
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTimeExpiry = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTimeExpiry / (1000 * 60 * 60 * 24));
      
      // Calculate days until use-by (only if item hasn't expired and has openedDate/useWithinDays)
      let daysUntilUseBy: number | null = null;
      if (daysUntilExpiry >= 0 && item.openedDate && item.useWithinDays) {
        const openedDate = new Date(item.openedDate);
        openedDate.setHours(0, 0, 0, 0);
        const useByDate = new Date(openedDate);
        useByDate.setDate(useByDate.getDate() + item.useWithinDays);
        const diffTimeUseBy = useByDate.getTime() - today.getTime();
        daysUntilUseBy = Math.ceil(diffTimeUseBy / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...item,
        daysUntilExpiry,
        daysUntilUseBy,
      };
    });
    
    return { success: true, data: itemsWithCalculations };
  } catch (error) {
    console.error("Error fetching fridge items:", error);
    return { success: false, error: "Failed to fetch fridge items" };
  }
}

export async function addItem(formData: { 
  name: string; 
  expiryDate: string;
  openedDate?: string;
  useWithinDays?: number;
}) {
  try {
    const { name, expiryDate, openedDate, useWithinDays } = formData;

    if (!name || !expiryDate) {
      return { success: false, error: "Name and expiryDate are required" };
    }

    const now = new Date();
    const item: InsertFridgeItem = {
      name,
      expiryDate,
      createdAt: now,
      updatedAt: now,
      createdBy: "joe", // TODO: Get from session/auth
      eatenStatus: "fresh",
      openedDate: openedDate || null,
      useWithinDays: useWithinDays || null,
    };

    await addFridgeItem(item);
    return { success: true };
  } catch (error) {
    console.error("Error adding fridge item:", error);
    return { success: false, error: "Failed to add fridge item" };
  }
}

export async function updateItem(
  id: number,
  updates: { 
    eatenStatus?: "fresh" | "half eaten" | "nearly eaten" | "eaten";
    openedDate?: string | null;
    useWithinDays?: number | null;
  }
) {
  try {
    await updateFridgeItem(id, updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating fridge item:", error);
    return { success: false, error: "Failed to update fridge item" };
  }
}

export async function deleteItem(id: number) {
  try {
    await removeFridgeItem(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting fridge item:", error);
    return { success: false, error: "Failed to delete fridge item" };
  }
}

