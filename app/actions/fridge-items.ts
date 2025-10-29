"use server";

import { getFridgeItems, addFridgeItem, removeFridgeItem, updateFridgeItem } from "@/lib/dbAdd";
import { InsertFridgeItem } from "@/app/src/db/schema";

export async function getItems() {
  try {
    const items = await getFridgeItems();
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching fridge items:", error);
    return { success: false, error: "Failed to fetch fridge items" };
  }
}

export async function addItem(formData: { name: string; expiryDate: string }) {
  try {
    const { name, expiryDate } = formData;

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
  updates: { eatenStatus?: "fresh" | "half eaten" | "nearly eaten" | "eaten" }
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

