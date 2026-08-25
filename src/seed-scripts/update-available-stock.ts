import "dotenv/config";
import { db } from "../lib/index";
import { products } from "../db/schema";

async function updateAvailableStock() {
    try {
        const result = await db
            .update(products)
            .set({
                availableStock: products.inventoryStock,
            });

        console.log("Available stock updated successfully.");
        console.log(result);
    } catch (error) {
        console.error("Failed to update available stock:", error);
    }
}

updateAvailableStock();