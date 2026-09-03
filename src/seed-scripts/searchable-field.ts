// import { sql } from "drizzle-orm";
// import { db } from "../lib/index";

// async function updateSearchableFields() {
//     await db.execute(sql`
//         UPDATE products
//         SET searchable_field = LOWER(
//             CONCAT_WS(
//                 ' ',
//                 product_name,
//                 description,
//                 category,
//                 attributes::text
//             )
//         );
//     `);

//     console.log("✅ searchable_field populated successfully");
// }

// updateSearchableFields()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error("❌ Failed to update searchable fields:", error);
//         process.exit(1);
//     });