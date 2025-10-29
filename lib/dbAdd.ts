import { fridgeItems, InsertFridgeItem } from "@/app/src/db/schema";
import { db } from "@/app/src/db";
import { eq } from "drizzle-orm";

export async function addFridgeItem(item: InsertFridgeItem){
    await db.insert(fridgeItems).values(item);
}

export async function removeFridgeItem(id: number){
    await db.delete(fridgeItems).where(eq(fridgeItems.id, id));
}

export async function getFridgeItems(){
    return await db.select().from(fridgeItems);
}
