// import "dotenv/config";

// import { db } from "../lib/index";
// import { merchants, products } from "../db/schema";

// type ProductCategory =
//     | "Electronics"
//     | "Clothing"
//     | "Footwear"
//     | "Books"
//     | "Beauty & Personal Care"
//     | "Grocery"
//     | "Sports & Fitness"
//     | "Bags & Luggage"
//     | "Mobile Phones";

// type ProductSeed = {
//     productName: string;
//     description: string;
//     category: ProductCategory;
//     price: number;
//     attributes: Record<string, string | number | boolean>;
// };

// const productData: ProductSeed[] = [
//     // ============================================================
//     // MOBILE PHONES
//     // ============================================================

//     {
//         productName: "Samsung Galaxy M35 5G",
//         description:
//             "Samsung smartphone with a Super AMOLED display, large battery, 5G connectivity, and versatile camera system.",
//         category: "Mobile Phones",
//         price: 14999,
//         attributes: {
//             brand: "Samsung",
//             model: "Galaxy M35 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.6-inch Super AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 6000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Samsung Galaxy M16 5G",
//         description:
//             "Affordable Samsung 5G smartphone designed for everyday communication, entertainment, and social media.",
//         category: "Mobile Phones",
//         price: 11999,
//         attributes: {
//             brand: "Samsung",
//             model: "Galaxy M16 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.7-inch Super AMOLED",
//             refreshRateHz: 90,
//             batteryMah: 5000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Redmi Note 14 5G",
//         description:
//             "Feature-rich Redmi smartphone with an AMOLED display, 5G connectivity, large battery, and high-resolution camera.",
//         category: "Mobile Phones",
//         price: 14999,
//         attributes: {
//             brand: "Xiaomi",
//             model: "Redmi Note 14 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.67-inch AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 5110,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Redmi Note 14",
//         description:
//             "Everyday Redmi smartphone offering an AMOLED display, reliable performance, and a large battery.",
//         category: "Mobile Phones",
//         price: 13999,
//         attributes: {
//             brand: "Xiaomi",
//             model: "Redmi Note 14",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.67-inch AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 5500,
//             cameraMP: 50,
//             fiveG: false,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "POCO M7 Pro 5G",
//         description:
//             "Performance-focused smartphone with AMOLED display, 5G connectivity, high-capacity battery, and fast charging.",
//         category: "Mobile Phones",
//         price: 13999,
//         attributes: {
//             brand: "POCO",
//             model: "M7 Pro 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.67-inch AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 5110,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "OnePlus Nord CE4 Lite 5G",
//         description:
//             "Affordable OnePlus 5G smartphone with AMOLED display, large battery, stereo speakers, and fast charging.",
//         category: "Mobile Phones",
//         price: 14999,
//         attributes: {
//             brand: "OnePlus",
//             model: "Nord CE4 Lite 5G",
//             ramGB: 8,
//             storageGB: 128,
//             display: "6.67-inch AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 5500,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Realme P3 5G",
//         description:
//             "Performance-oriented Realme smartphone with a high-refresh-rate AMOLED display and large battery.",
//         category: "Mobile Phones",
//         price: 13999,
//         attributes: {
//             brand: "Realme",
//             model: "P3 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.67-inch AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 6000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Motorola Moto G85 5G",
//         description:
//             "Slim Motorola smartphone featuring a curved pOLED display, 5G connectivity, and a large battery.",
//         category: "Mobile Phones",
//         price: 14999,
//         attributes: {
//             brand: "Motorola",
//             model: "Moto G85 5G",
//             ramGB: 8,
//             storageGB: 128,
//             display: "6.67-inch pOLED",
//             refreshRateHz: 120,
//             batteryMah: 5000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "Nothing CMF Phone 1",
//         description:
//             "Distinctive mid-range smartphone with AMOLED display, MediaTek processor, expandable storage, and clean software experience.",
//         category: "Mobile Phones",
//         price: 14999,
//         attributes: {
//             brand: "CMF by Nothing",
//             model: "CMF Phone 1",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.67-inch Super AMOLED",
//             refreshRateHz: 120,
//             batteryMah: 5000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     {
//         productName: "iQOO Z9x 5G",
//         description:
//             "Battery-focused smartphone with a high-refresh-rate display, Snapdragon processor, and 5G connectivity.",
//         category: "Mobile Phones",
//         price: 12999,
//         attributes: {
//             brand: "iQOO",
//             model: "Z9x 5G",
//             ramGB: 6,
//             storageGB: 128,
//             display: "6.72-inch LCD",
//             refreshRateHz: 120,
//             batteryMah: 6000,
//             cameraMP: 50,
//             fiveG: true,
//             usbPort: "USB-C",
//         },
//     },

//     // ============================================================
//     // ELECTRONICS - USB / PENDRIVE / STORAGE
//     // ============================================================

//     {
//         productName: "SanDisk Ultra Flair 64GB USB 3.0",
//         description:
//             "Compact metal USB flash drive designed for fast everyday transfer of documents, photos, videos, and other files.",
//         category: "Electronics",
//         price: 599,
//         attributes: {
//             brand: "SanDisk",
//             model: "Ultra Flair",
//             storageGB: 64,
//             interface: "USB 3.0",
//             connector: "USB-A",
//             metalBody: true,
//         },
//     },

//     {
//         productName: "SanDisk Ultra Flair 128GB USB 3.0",
//         description:
//             "High-capacity metal USB flash drive for storing and transferring everyday files between computers and other compatible devices.",
//         category: "Electronics",
//         price: 899,
//         attributes: {
//             brand: "SanDisk",
//             model: "Ultra Flair",
//             storageGB: 128,
//             interface: "USB 3.0",
//             connector: "USB-A",
//             metalBody: true,
//         },
//     },

//     {
//         productName: "SanDisk Ultra Dual Drive Go 128GB",
//         description:
//             "Dual USB-C and USB-A flash drive designed for convenient file transfers between smartphones, tablets, and computers.",
//         category: "Electronics",
//         price: 1199,
//         attributes: {
//             brand: "SanDisk",
//             model: "Ultra Dual Drive Go",
//             storageGB: 128,
//             interface: "USB 3.2",
//             connector: "USB-C + USB-A",
//             dualConnector: true,
//         },
//     },

//     {
//         productName: "Samsung BAR Plus 128GB USB 3.1",
//         description:
//             "Durable metal USB flash drive offering reliable storage and fast file transfers for everyday use.",
//         category: "Electronics",
//         price: 999,
//         attributes: {
//             brand: "Samsung",
//             model: "BAR Plus",
//             storageGB: 128,
//             interface: "USB 3.1",
//             connector: "USB-A",
//             metalBody: true,
//             waterproof: true,
//         },
//     },

//     {
//         productName: "Kingston DataTraveler Exodia 128GB",
//         description:
//             "Affordable USB flash drive suitable for storing documents, photos, videos, and other everyday files.",
//         category: "Electronics",
//         price: 749,
//         attributes: {
//             brand: "Kingston",
//             model: "DataTraveler Exodia",
//             storageGB: 128,
//             interface: "USB 3.2 Gen 1",
//             connector: "USB-A",
//         },
//     },

//     {
//         productName: "Kingston DataTraveler Max 256GB USB-C",
//         description:
//             "High-capacity USB-C flash drive designed for fast transfers and convenient storage on modern laptops and mobile devices.",
//         category: "Electronics",
//         price: 2499,
//         attributes: {
//             brand: "Kingston",
//             model: "DataTraveler Max",
//             storageGB: 256,
//             interface: "USB 3.2 Gen 2",
//             connector: "USB-C",
//         },
//     },

//     {
//         productName: "Samsung T7 Portable SSD 500GB",
//         description:
//             "Compact portable SSD providing fast external storage for laptops, desktops, tablets, and compatible smartphones.",
//         category: "Electronics",
//         price: 5999,
//         attributes: {
//             brand: "Samsung",
//             model: "T7",
//             storageGB: 500,
//             interface: "USB 3.2 Gen 2",
//             connector: "USB-C",
//             readSpeedMBps: 1050,
//             portable: true,
//         },
//     },

//     {
//         productName: "Samsung T7 Portable SSD 1TB",
//         description:
//             "Portable high-speed SSD designed for fast file transfers, backups, project storage, and media workflows.",
//         category: "Electronics",
//         price: 9999,
//         attributes: {
//             brand: "Samsung",
//             model: "T7",
//             storageGB: 1024,
//             interface: "USB 3.2 Gen 2",
//             connector: "USB-C",
//             readSpeedMBps: 1050,
//             portable: true,
//         },
//     },

//     {
//         productName: "SanDisk Extreme Portable SSD 500GB",
//         description:
//             "Compact portable SSD designed for fast storage and file transfers while traveling or working remotely.",
//         category: "Electronics",
//         price: 6499,
//         attributes: {
//             brand: "SanDisk",
//             model: "Extreme Portable SSD",
//             storageGB: 500,
//             interface: "USB 3.2 Gen 2",
//             connector: "USB-C",
//             readSpeedMBps: 1050,
//             portable: true,
//         },
//     },

//     // ============================================================
//     // USB HUBS / ADAPTERS
//     // ============================================================

//     {
//         productName: "Anker 5-in-1 USB-C Hub",
//         description:
//             "Compact USB-C hub providing HDMI, USB-A, USB-C, and additional connectivity for modern laptops and tablets.",
//         category: "Electronics",
//         price: 2499,
//         attributes: {
//             brand: "Anker",
//             ports: 5,
//             usbA: 2,
//             usbC: 1,
//             hdmi: true,
//             powerDelivery: true,
//         },
//     },

//     {
//         productName: "Anker 7-in-1 USB-C Hub",
//         description:
//             "Multi-port USB-C hub with HDMI, USB-A, USB-C, SD card, and microSD connectivity for laptops and tablets.",
//         category: "Electronics",
//         price: 4499,
//         attributes: {
//             brand: "Anker",
//             ports: 7,
//             usbA: 2,
//             usbC: 1,
//             hdmi: true,
//             sdCard: true,
//             microSD: true,
//             powerDelivery: true,
//         },
//     },

//     {
//         productName: "UGREEN 6-in-1 USB-C Hub",
//         description:
//             "Compact multi-port USB-C adapter designed to expand connectivity on MacBooks, Windows laptops, and tablets.",
//         category: "Electronics",
//         price: 2999,
//         attributes: {
//             brand: "UGREEN",
//             ports: 6,
//             usbA: 3,
//             usbC: 1,
//             hdmi: true,
//             sdCard: true,
//             powerDelivery: true,
//         },
//     },

//     {
//         productName: "Belkin 5-in-1 USB-C Hub",
//         description:
//             "Compact premium USB-C hub offering USB ports, HDMI output, and USB-C power delivery for modern computers.",
//         category: "Electronics",
//         price: 3999,
//         attributes: {
//             brand: "Belkin",
//             ports: 5,
//             usbA: 2,
//             usbC: 1,
//             hdmi: true,
//             powerDelivery: true,
//         },
//     },

//     {
//         productName: "TP-Link USB-C to Gigabit Ethernet Adapter",
//         description:
//             "Compact USB-C network adapter providing reliable Gigabit Ethernet connectivity for compatible laptops and tablets.",
//         category: "Electronics",
//         price: 1499,
//         attributes: {
//             brand: "TP-Link",
//             connector: "USB-C",
//             ethernet: "Gigabit Ethernet",
//             plugAndPlay: true,
//         },
//     },

//     // ============================================================
//     // CHARGERS / CABLES
//     // ============================================================

//     {
//         productName: "Apple 20W USB-C Power Adapter",
//         description:
//             "Compact USB-C power adapter suitable for charging iPhone, iPad, AirPods, and other compatible devices.",
//         category: "Electronics",
//         price: 1899,
//         attributes: {
//             brand: "Apple",
//             powerWatts: 20,
//             port: "USB-C",
//             usbPD: true,
//         },
//     },

//     {
//         productName: "Samsung 25W USB-C Fast Charger",
//         description:
//             "Compact Samsung USB-C charger designed for fast charging compatible Galaxy smartphones and other USB-C devices.",
//         category: "Electronics",
//         price: 1299,
//         attributes: {
//             brand: "Samsung",
//             powerWatts: 25,
//             port: "USB-C",
//             usbPD: true,
//         },
//     },

//     {
//         productName: "Anker 45W USB-C Charger",
//         description:
//             "Fast USB-C charger suitable for smartphones, tablets, handheld gaming devices, and other compatible electronics.",
//         category: "Electronics",
//         price: 2499,
//         attributes: {
//             brand: "Anker",
//             powerWatts: 45,
//             port: "USB-C",
//             usbPD: true,
//         },
//     },

//     {
//         productName: "Anker 65W GaN Charger",
//         description:
//             "Compact GaN charger capable of powering smartphones, tablets, laptops, and other USB-C devices.",
//         category: "Electronics",
//         price: 3999,
//         attributes: {
//             brand: "Anker",
//             powerWatts: 65,
//             technology: "GaN",
//             ports: 3,
//             usbC: 2,
//             usbA: 1,
//             usbPD: true,
//         },
//     },

//     {
//         productName: "UGREEN 100W GaN Charger",
//         description:
//             "High-power GaN charger designed to charge multiple USB-C devices including laptops, tablets, and smartphones.",
//         category: "Electronics",
//         price: 4999,
//         attributes: {
//             brand: "UGREEN",
//             powerWatts: 100,
//             technology: "GaN",
//             ports: 4,
//             usbC: 3,
//             usbA: 1,
//             usbPD: true,
//         },
//     },

//     {
//         productName: "Anker USB-C to USB-C Cable 100W",
//         description:
//             "Durable USB-C cable supporting high-power charging for laptops, tablets, smartphones, and other compatible devices.",
//         category: "Electronics",
//         price: 999,
//         attributes: {
//             brand: "Anker",
//             connector: "USB-C to USB-C",
//             lengthMeters: 1.8,
//             powerWatts: 100,
//             usbPD: true,
//         },
//     },

//     {
//         productName: "Belkin USB-C to USB-C Cable 60W",
//         description:
//             "Reliable USB-C charging and data cable designed for smartphones, tablets, laptops, and accessories.",
//         category: "Electronics",
//         price: 899,
//         attributes: {
//             brand: "Belkin",
//             connector: "USB-C to USB-C",
//             lengthMeters: 1,
//             powerWatts: 60,
//             usbPD: true,
//         },
//     },

//     // ============================================================
//     // POWER BANKS
//     // ============================================================

//     {
//         productName: "Anker PowerCore 10000mAh",
//         description:
//             "Compact portable power bank designed for convenient charging of smartphones, earbuds, and other USB devices.",
//         category: "Electronics",
//         price: 1499,
//         attributes: {
//             brand: "Anker",
//             capacityMah: 10000,
//             usbPorts: 1,
//             portable: true,
//         },
//     },

//     {
//         productName: "Anker PowerCore 20000mAh",
//         description:
//             "High-capacity portable power bank designed for smartphones, tablets, and accessories during travel.",
//         category: "Electronics",
//         price: 2499,
//         attributes: {
//             brand: "Anker",
//             capacityMah: 20000,
//             usbPorts: 2,
//             usbC: true,
//             fastCharging: true,
//         },
//     },

//     {
//         productName: "MI Power Bank 10000mAh",
//         description:
//             "Compact Xiaomi power bank for everyday charging of smartphones, earbuds, and other USB-powered devices.",
//         category: "Electronics",
//         price: 999,
//         attributes: {
//             brand: "Xiaomi",
//             capacityMah: 10000,
//             usbPorts: 2,
//             usbC: true,
//         },
//     },

//     {
//         productName: "MI Power Bank 20000mAh",
//         description:
//             "High-capacity Xiaomi power bank with multiple ports for charging smartphones and other portable electronics.",
//         category: "Electronics",
//         price: 1799,
//         attributes: {
//             brand: "Xiaomi",
//             capacityMah: 20000,
//             usbPorts: 2,
//             usbC: true,
//             fastCharging: true,
//         },
//     },

//     // ============================================================
//     // SMARTWATCHES
//     // ============================================================

//     {
//         productName: "CMF Watch Pro 2",
//         description:
//             "Affordable smartwatch with AMOLED display, Bluetooth calling, health tracking, GPS, and multiple sports modes.",
//         category: "Electronics",
//         price: 4999,
//         attributes: {
//             brand: "CMF by Nothing",
//             model: "Watch Pro 2",
//             display: "AMOLED",
//             gps: true,
//             heartRateMonitor: true,
//             sleepTracking: true,
//             bluetoothCalling: true,
//             waterResistance: true,
//         },
//     },

//     {
//         productName: "Amazfit Active",
//         description:
//             "Fitness-focused smartwatch with AMOLED display, GPS tracking, health monitoring, and long battery life.",
//         category: "Electronics",
//         price: 7999,
//         attributes: {
//             brand: "Amazfit",
//             model: "Active",
//             display: "AMOLED",
//             gps: true,
//             heartRateMonitor: true,
//             sleepTracking: true,
//             waterResistance: true,
//         },
//     },

//     {
//         productName: "Amazfit Bip 5",
//         description:
//             "Large-display fitness smartwatch with GPS, health tracking, Bluetooth calling, and extended battery life.",
//         category: "Electronics",
//         price: 5499,
//         attributes: {
//             brand: "Amazfit",
//             model: "Bip 5",
//             display: "TFT LCD",
//             gps: true,
//             heartRateMonitor: true,
//             sleepTracking: true,
//             bluetoothCalling: true,
//         },
//     },

//     {
//         productName: "Samsung Galaxy Fit3",
//         description:
//             "Slim fitness tracker with AMOLED display, health monitoring, sleep tracking, and activity tracking.",
//         category: "Electronics",
//         price: 3999,
//         attributes: {
//             brand: "Samsung",
//             model: "Galaxy Fit3",
//             display: "AMOLED",
//             heartRateMonitor: true,
//             sleepTracking: true,
//             waterResistance: true,
//             fitnessTracking: true,
//         },
//     },

//     // ============================================================
//     // CLOTHING
//     // ============================================================

//     {
//         productName: "Levi's Men's 511 Slim Fit Jeans",
//         description:
//             "Classic slim-fit denim jeans designed with a modern silhouette for everyday casual wear.",
//         category: "Clothing",
//         price: 2999,
//         attributes: {
//             brand: "Levi's",
//             material: "Denim",
//             fit: "Slim",
//             waistSizes: "28-38",
//             stretch: true,
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Levi's Men's 512 Tapered Jeans",
//         description:
//             "Modern tapered jeans combining a comfortable fit around the thigh with a narrower leg opening.",
//         category: "Clothing",
//         price: 3299,
//         attributes: {
//             brand: "Levi's",
//             material: "Denim",
//             fit: "Tapered",
//             waistSizes: "28-38",
//             stretch: true,
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Nike Men's Dri-FIT T-Shirt",
//         description:
//             "Lightweight sports T-shirt made with moisture-wicking fabric for training, running, and everyday activities.",
//         category: "Clothing",
//         price: 1999,
//         attributes: {
//             brand: "Nike",
//             material: "Polyester",
//             technology: "Dri-FIT",
//             fit: "Regular",
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Adidas Men's Essentials T-Shirt",
//         description:
//             "Everyday cotton-blend T-shirt with a comfortable regular fit suitable for casual wear and light activity.",
//         category: "Clothing",
//         price: 1499,
//         attributes: {
//             brand: "Adidas",
//             material: "Cotton Blend",
//             fit: "Regular",
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Puma Men's Essentials Hoodie",
//         description:
//             "Comfortable cotton-blend hoodie designed for casual everyday wear and cool-weather layering.",
//         category: "Clothing",
//         price: 2499,
//         attributes: {
//             brand: "Puma",
//             material: "Cotton Blend",
//             fit: "Regular",
//             hooded: true,
//             gender: "Men",
//         },
//     },

//     {
//         productName: "H&M Women's Relaxed Fit T-Shirt",
//         description:
//             "Soft everyday T-shirt with a relaxed silhouette designed for casual outfits and comfortable daily wear.",
//         category: "Clothing",
//         price: 999,
//         attributes: {
//             brand: "H&M",
//             material: "Cotton",
//             fit: "Relaxed",
//             gender: "Women",
//         },
//     },

//     {
//         productName: "H&M Women's Cotton Kurti",
//         description:
//             "Comfortable cotton kurti with an everyday silhouette suitable for casual and semi-casual occasions.",
//         category: "Clothing",
//         price: 1499,
//         attributes: {
//             brand: "H&M",
//             material: "Cotton",
//             fit: "Regular",
//             gender: "Women",
//         },
//     },

//     {
//         productName: "Roadster Men's Casual Shirt",
//         description:
//             "Casual everyday shirt with a comfortable fit suitable for office-casual outfits and weekend wear.",
//         category: "Clothing",
//         price: 1299,
//         attributes: {
//             brand: "Roadster",
//             material: "Cotton Blend",
//             fit: "Regular",
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Van Heusen Men's Formal Shirt",
//         description:
//             "Classic formal shirt designed for office wear, business meetings, and professional occasions.",
//         category: "Clothing",
//         price: 1999,
//         attributes: {
//             brand: "Van Heusen",
//             material: "Cotton Blend",
//             fit: "Regular",
//             formalWear: true,
//             gender: "Men",
//         },
//     },

//     {
//         productName: "Allen Solly Women's Casual Top",
//         description:
//             "Smart casual women's top designed for everyday office and casual styling.",
//         category: "Clothing",
//         price: 1599,
//         attributes: {
//             brand: "Allen Solly",
//             material: "Viscose Blend",
//             fit: "Regular",
//             gender: "Women",
//         },
//     },

//     // ============================================================
//     // FOOTWEAR
//     // ============================================================

//     {
//         productName: "Nike Revolution 7 Running Shoes",
//         description:
//             "Lightweight running shoes designed for daily training, walking, and casual active use.",
//         category: "Footwear",
//         price: 3499,
//         attributes: {
//             brand: "Nike",
//             model: "Revolution 7",
//             type: "Running Shoes",
//             upper: "Mesh",
//             sole: "Rubber",
//             closure: "Lace-Up",
//         },
//     },

//     {
//         productName: "Adidas Duramo SL Running Shoes",
//         description:
//             "Lightweight running shoes with cushioned support for everyday running, walking, and training.",
//         category: "Footwear",
//         price: 3999,
//         attributes: {
//             brand: "Adidas",
//             model: "Duramo SL",
//             type: "Running Shoes",
//             upper: "Mesh",
//             sole: "Rubber",
//             closure: "Lace-Up",
//         },
//     },

//     {
//         productName: "Puma Softride Enzo NXT",
//         description:
//             "Comfortable sports shoes with cushioned construction designed for running, walking, and everyday activity.",
//         category: "Footwear",
//         price: 3299,
//         attributes: {
//             brand: "Puma",
//             model: "Softride Enzo NXT",
//             type: "Running Shoes",
//             upper: "Mesh",
//             cushioning: true,
//             closure: "Lace-Up",
//         },
//     },

//     {
//         productName: "Skechers Go Walk Flex",
//         description:
//             "Comfort-focused walking shoes designed for everyday use with lightweight construction and flexible cushioning.",
//         category: "Footwear",
//         price: 4499,
//         attributes: {
//             brand: "Skechers",
//             model: "Go Walk Flex",
//             type: "Walking Shoes",
//             upper: "Mesh",
//             lightweight: true,
//             flexibleSole: true,
//         },
//     },

//     {
//         productName: "Campus Men's Casual Sneakers",
//         description:
//             "Affordable everyday sneakers designed for casual outfits, commuting, and daily use.",
//         category: "Footwear",
//         price: 1499,
//         attributes: {
//             brand: "Campus",
//             type: "Casual Sneakers",
//             upper: "Synthetic",
//             sole: "EVA",
//             closure: "Lace-Up",
//         },
//     },

//     {
//         productName: "Bata Men's Formal Shoes",
//         description:
//             "Classic formal shoes designed for office wear, business meetings, and professional occasions.",
//         category: "Footwear",
//         price: 2299,
//         attributes: {
//             brand: "Bata",
//             type: "Formal Shoes",
//             upper: "Synthetic Leather",
//             sole: "Rubber",
//             closure: "Lace-Up",
//         },
//     },

//     {
//         productName: "Woodland Men's Casual Shoes",
//         description:
//             "Durable casual footwear designed for everyday outdoor use with a rugged construction.",
//         category: "Footwear",
//         price: 4999,
//         attributes: {
//             brand: "Woodland",
//             type: "Casual Shoes",
//             upper: "Leather",
//             sole: "Rubber",
//             outdoorUse: true,
//         },
//     },

//     {
//         productName: "Crocs Classic Clog",
//         description:
//             "Lightweight slip-on clogs with a comfortable molded construction suitable for everyday casual use.",
//         category: "Footwear",
//         price: 2999,
//         attributes: {
//             brand: "Crocs",
//             model: "Classic Clog",
//             type: "Clogs",
//             material: "Croslite",
//             lightweight: true,
//             waterResistant: true,
//         },
//     },

//     // ============================================================
//     // BOOKS
//     // ============================================================

//     {
//         productName: "Atomic Habits",
//         description:
//             "A practical guide to building good habits, breaking bad ones, and making small changes that produce lasting results.",
//         category: "Books",
//         price: 499,
//         attributes: {
//             author: "James Clear",
//             format: "Paperback",
//             language: "English",
//             genre: "Self Help",
//         },
//     },

//     {
//         productName: "The Psychology of Money",
//         description:
//             "A practical exploration of how people think about money, investing, risk, wealth, and financial decisions.",
//         category: "Books",
//         price: 399,
//         attributes: {
//             author: "Morgan Housel",
//             format: "Paperback",
//             language: "English",
//             genre: "Finance",
//         },
//     },

//     {
//         productName: "Deep Work",
//         description:
//             "A guide to developing focused concentration and producing high-quality work in a distracted world.",
//         category: "Books",
//         price: 449,
//         attributes: {
//             author: "Cal Newport",
//             format: "Paperback",
//             language: "English",
//             genre: "Productivity",
//         },
//     },

//     {
//         productName: "Clean Code",
//         description:
//             "A software engineering book focused on writing readable, maintainable, and professional-quality code.",
//         category: "Books",
//         price: 799,
//         attributes: {
//             author: "Robert C. Martin",
//             format: "Paperback",
//             language: "English",
//             genre: "Programming",
//         },
//     },

//     {
//         productName: "The Pragmatic Programmer",
//         description:
//             "A practical software development guide covering programming practices, design principles, debugging, and professional development.",
//         category: "Books",
//         price: 899,
//         attributes: {
//             author: "David Thomas and Andrew Hunt",
//             format: "Paperback",
//             language: "English",
//             genre: "Programming",
//         },
//     },

//     {
//         productName: "You Don't Know JS Yet",
//         description:
//             "A JavaScript book series exploring the core concepts and mechanics behind the JavaScript language.",
//         category: "Books",
//         price: 699,
//         attributes: {
//             author: "Kyle Simpson",
//             format: "Paperback",
//             language: "English",
//             genre: "Programming",
//             subject: "JavaScript",
//         },
//     },

//     {
//         productName: "Ikigai",
//         description:
//             "A book exploring the Japanese concept of purpose, meaning, and finding fulfillment in everyday life.",
//         category: "Books",
//         price: 299,
//         attributes: {
//             author: "Hector Garcia and Francesc Miralles",
//             format: "Paperback",
//             language: "English",
//             genre: "Self Help",
//         },
//     },

//     {
//         productName: "Rich Dad Poor Dad",
//         description:
//             "A personal finance classic discussing financial education, investing, assets, liabilities, and wealth-building perspectives.",
//         category: "Books",
//         price: 399,
//         attributes: {
//             author: "Robert T. Kiyosaki",
//             format: "Paperback",
//             language: "English",
//             genre: "Finance",
//         },
//     },

//     // ============================================================
//     // BEAUTY & PERSONAL CARE
//     // ============================================================

//     {
//         productName: "The Derma Co 10% Niacinamide Face Serum",
//         description:
//             "Lightweight facial serum formulated with niacinamide for a simple daily skincare routine.",
//         category: "Beauty & Personal Care",
//         price: 599,
//         attributes: {
//             brand: "The Derma Co",
//             volumeMl: 30,
//             ingredient: "Niacinamide",
//             suitableFor: "All Skin Types",
//             dailyUse: true,
//         },
//     },

//     {
//         productName: "Minimalist 10% Niacinamide Serum",
//         description:
//             "Daily facial serum formulated with niacinamide to support a simple and consistent skincare routine.",
//         category: "Beauty & Personal Care",
//         price: 599,
//         attributes: {
//             brand: "Minimalist",
//             volumeMl: 30,
//             ingredient: "Niacinamide",
//             fragranceFree: true,
//             dailyUse: true,
//         },
//     },

//     {
//         productName: "Minimalist 2% Salicylic Acid Serum",
//         description:
//             "Lightweight skincare serum formulated with salicylic acid for use in targeted skincare routines.",
//         category: "Beauty & Personal Care",
//         price: 549,
//         attributes: {
//             brand: "Minimalist",
//             volumeMl: 30,
//             ingredient: "Salicylic Acid",
//             fragranceFree: true,
//         },
//     },

//     {
//         productName: "Cetaphil Gentle Skin Cleanser",
//         description:
//             "Gentle facial cleanser designed for everyday cleansing without leaving the skin feeling excessively dry.",
//         category: "Beauty & Personal Care",
//         price: 499,
//         attributes: {
//             brand: "Cetaphil",
//             volumeMl: 125,
//             skinType: "Normal to Sensitive",
//             fragranceFree: true,
//             dailyUse: true,
//         },
//     },

//     {
//         productName: "Nivea Soft Moisturizing Cream",
//         description:
//             "Lightweight moisturizing cream suitable for everyday face, body, and hand care.",
//         category: "Beauty & Personal Care",
//         price: 299,
//         attributes: {
//             brand: "Nivea",
//             volumeGrams: 200,
//             moisturizing: true,
//             dailyUse: true,
//         },
//     },

//     {
//         productName: "L'Oréal Paris Total Repair 5 Shampoo",
//         description:
//             "Everyday shampoo formulated for cleansing and hair care with a focus on damaged and dry-looking hair.",
//         category: "Beauty & Personal Care",
//         price: 499,
//         attributes: {
//             brand: "L'Oréal Paris",
//             volumeMl: 650,
//             hairType: "Damaged Hair",
//             dailyUse: true,
//         },
//     },

//     {
//         productName: "Mamaearth Onion Hair Oil",
//         description:
//             "Hair oil formulated with onion extract and other ingredients for regular hair-care routines.",
//         category: "Beauty & Personal Care",
//         price: 449,
//         attributes: {
//             brand: "Mamaearth",
//             volumeMl: 150,
//             ingredient: "Onion Extract",
//             hairCare: true,
//         },
//     },

//     {
//         productName: "Philips BT3201 Beard Trimmer",
//         description:
//             "Rechargeable beard trimmer designed for everyday grooming with adjustable trimming lengths.",
//         category: "Beauty & Personal Care",
//         price: 1299,
//         attributes: {
//             brand: "Philips",
//             model: "BT3201",
//             batteryLifeMinutes: 60,
//             rechargeable: true,
//             adjustableLength: true,
//             charging: "USB",
//         },
//     },

//     {
//         productName: "Philips Hair Dryer 1200W",
//         description:
//             "Compact hair dryer with multiple heat and speed settings for everyday personal grooming.",
//         category: "Beauty & Personal Care",
//         price: 1499,
//         attributes: {
//             brand: "Philips",
//             powerWatts: 1200,
//             heatSettings: 3,
//             speedSettings: 2,
//             coolShot: true,
//         },
//     },

//     // ============================================================
//     // BAGS & LUGGAGE
//     // ============================================================

//     {
//         productName: "American Tourister Casual Backpack 28L",
//         description:
//             "Everyday backpack with spacious compartments suitable for office, college, commuting, and short trips.",
//         category: "Bags & Luggage",
//         price: 1999,
//         attributes: {
//             brand: "American Tourister",
//             capacityLitres: 28,
//             material: "Polyester",
//             laptopCompartment: true,
//             waterResistant: true,
//         },
//     },

//     {
//         productName: "Skybags Brat Backpack 30L",
//         description:
//             "Spacious casual backpack designed for college, work, travel, and everyday commuting.",
//         category: "Bags & Luggage",
//         price: 1699,
//         attributes: {
//             brand: "Skybags",
//             capacityLitres: 30,
//             material: "Polyester",
//             laptopCompartment: true,
//             waterResistant: true,
//         },
//     },

//     {
//         productName: "Wildcraft 35L Laptop Backpack",
//         description:
//             "Durable backpack with a dedicated laptop compartment and multiple storage sections for work and travel.",
//         category: "Bags & Luggage",
//         price: 2499,
//         attributes: {
//             brand: "Wildcraft",
//             capacityLitres: 35,
//             material: "Polyester",
//             laptopCompartment: true,
//             waterResistant: true,
//         },
//     },

//     {
//         productName: "Safari Pentagon 55cm Cabin Trolley",
//         description:
//             "Compact hard-shell cabin trolley designed for short business trips and weekend travel.",
//         category: "Bags & Luggage",
//         price: 2999,
//         attributes: {
//             brand: "Safari",
//             size: "Cabin",
//             heightCm: 55,
//             material: "Polycarbonate",
//             wheels: 4,
//             tsaLock: true,
//         },
//     },

//     {
//         productName: "American Tourister Liftoff Cabin Trolley",
//         description:
//             "Lightweight cabin suitcase designed for convenient short-distance and air travel.",
//         category: "Bags & Luggage",
//         price: 3999,
//         attributes: {
//             brand: "American Tourister",
//             size: "Cabin",
//             material: "Polypropylene",
//             wheels: 4,
//             tsaLock: true,
//         },
//     },

//     {
//         productName: "Wildcraft Travel Duffel Bag 40L",
//         description:
//             "Spacious travel duffel suitable for short trips, gym use, and weekend travel.",
//         category: "Bags & Luggage",
//         price: 1499,
//         attributes: {
//             brand: "Wildcraft",
//             capacityLitres: 40,
//             material: "Polyester",
//             shoulderStrap: true,
//             waterResistant: true,
//         },
//     },

//     {
//         productName: "Mokobara Sling Bag",
//         description:
//             "Compact everyday sling bag designed to carry phones, wallets, chargers, and other personal essentials.",
//         category: "Bags & Luggage",
//         price: 2999,
//         attributes: {
//             brand: "Mokobara",
//             type: "Sling Bag",
//             material: "Polyester",
//             adjustableStrap: true,
//             compact: true,
//         },
//     },

//     // ============================================================
//     // SPORTS & FITNESS
//     // ============================================================

//     {
//         productName: "Decathlon Domyos Yoga Mat 6mm",
//         description:
//             "Non-slip exercise mat designed for yoga, stretching, mobility exercises, and home workouts.",
//         category: "Sports & Fitness",
//         price: 799,
//         attributes: {
//             brand: "Decathlon",
//             material: "PVC",
//             thicknessMm: 6,
//             nonSlip: true,
//             lengthCm: 180,
//         },
//     },

//     {
//         productName: "Decathlon Adjustable Dumbbell Set",
//         description:
//             "Adjustable dumbbell set designed for strength training and home workouts with multiple weight configurations.",
//         category: "Sports & Fitness",
//         price: 2999,
//         attributes: {
//             brand: "Decathlon",
//             material: "Cast Iron",
//             adjustable: true,
//             totalWeightKg: 20,
//             pieces: 2,
//         },
//     },

//     {
//         productName: "Boldfit Resistance Band Set",
//         description:
//             "Multi-level resistance band set suitable for strength training, mobility exercises, and home workouts.",
//         category: "Sports & Fitness",
//         price: 699,
//         attributes: {
//             brand: "Boldfit",
//             bands: 5,
//             material: "Latex",
//             resistanceLevels: true,
//             portable: true,
//         },
//     },

//     {
//         productName: "Nivia Storm Football",
//         description:
//             "Durable training football suitable for recreational games, practice sessions, and outdoor matches.",
//         category: "Sports & Fitness",
//         price: 899,
//         attributes: {
//             brand: "Nivia",
//             size: 5,
//             material: "Synthetic Leather",
//             bladder: "Butyl",
//             outdoorUse: true,
//         },
//     },

//     {
//         productName: "Cosco Kashmir Willow Cricket Bat",
//         description:
//             "Kashmir willow cricket bat designed for recreational and club-level cricket practice and matches.",
//         category: "Sports & Fitness",
//         price: 2499,
//         attributes: {
//             brand: "Cosco",
//             material: "Kashmir Willow",
//             size: "Full Size",
//             grip: "Rubber",
//             sport: "Cricket",
//         },
//     },

//     {
//         productName: "Yonex Mavis 350 Badminton Shuttlecock",
//         description:
//             "Durable nylon shuttlecock designed for badminton practice, training, and recreational play.",
//         category: "Sports & Fitness",
//         price: 799,
//         attributes: {
//             brand: "Yonex",
//             model: "Mavis 350",
//             material: "Nylon",
//             speed: "Medium",
//             sport: "Badminton",
//         },
//     },

//     {
//         productName: "Yonex Nanoray 72 Light Badminton Racket",
//         description:
//             "Lightweight badminton racket designed for recreational and intermediate players seeking easy handling.",
//         category: "Sports & Fitness",
//         price: 1999,
//         attributes: {
//             brand: "Yonex",
//             model: "Nanoray 72 Light",
//             weightGrams: 77,
//             material: "Graphite",
//             sport: "Badminton",
//         },
//     },

//     {
//         productName: "Decathlon Kalenji Running Shoes",
//         description:
//             "Affordable running shoes designed for beginner runners, walking, and everyday fitness activities.",
//         category: "Sports & Fitness",
//         price: 1999,
//         attributes: {
//             brand: "Decathlon",
//             type: "Running Shoes",
//             upper: "Mesh",
//             sole: "EVA",
//             lightweight: true,
//         },
//     },

//     // ============================================================
//     // GROCERY
//     // ============================================================

//     {
//         productName: "India Gate Basmati Rice 5kg",
//         description:
//             "Long-grain basmati rice suitable for everyday meals, biryani, pulao, and other rice-based dishes.",
//         category: "Grocery",
//         price: 699,
//         attributes: {
//             brand: "India Gate",
//             weightKg: 5,
//             grainType: "Long Grain",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Fortune Sunflower Oil 5L",
//         description:
//             "Refined sunflower cooking oil suitable for everyday Indian cooking, frying, and food preparation.",
//         category: "Grocery",
//         price: 799,
//         attributes: {
//             brand: "Fortune",
//             volumeLitres: 5,
//             oilType: "Sunflower",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Aashirvaad Atta 5kg",
//         description:
//             "Whole wheat flour suitable for preparing rotis, chapatis, parathas, and everyday Indian meals.",
//         category: "Grocery",
//         price: 299,
//         attributes: {
//             brand: "Aashirvaad",
//             weightKg: 5,
//             grainType: "Whole Wheat",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Tata Salt 1kg",
//         description:
//             "Iodized edible salt suitable for everyday cooking and food preparation.",
//         category: "Grocery",
//         price: 30,
//         attributes: {
//             brand: "Tata",
//             weightKg: 1,
//             type: "Iodized Salt",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Tata Tea Gold 500g",
//         description:
//             "Blended black tea designed for preparing everyday cups of tea at home.",
//         category: "Grocery",
//         price: 299,
//         attributes: {
//             brand: "Tata Tea",
//             weightGrams: 500,
//             type: "Black Tea",
//             caffeine: true,
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Nescafé Classic Instant Coffee 200g",
//         description:
//             "Instant coffee designed for quick preparation of hot or cold coffee beverages.",
//         category: "Grocery",
//         price: 499,
//         attributes: {
//             brand: "Nescafé",
//             weightGrams: 200,
//             type: "Instant Coffee",
//             caffeine: true,
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Quaker Oats 1kg",
//         description:
//             "Whole grain oats suitable for breakfast bowls, porridge, smoothies, and everyday meal preparation.",
//         category: "Grocery",
//         price: 199,
//         attributes: {
//             brand: "Quaker",
//             weightKg: 1,
//             type: "Whole Grain Oats",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Almonds 500g",
//         description:
//             "Premium whole almonds suitable for snacking, cooking, baking, and everyday nutrition.",
//         category: "Grocery",
//         price: 449,
//         attributes: {
//             weightGrams: 500,
//             type: "Almonds",
//             roasted: false,
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Tata Sampann Toor Dal 1kg",
//         description:
//             "Everyday toor dal suitable for preparing dal, curries, and traditional Indian meals.",
//         category: "Grocery",
//         price: 179,
//         attributes: {
//             brand: "Tata Sampann",
//             weightKg: 1,
//             type: "Toor Dal",
//             vegetarian: true,
//         },
//     },

//     {
//         productName: "Kellogg's Corn Flakes 500g",
//         description:
//             "Crispy breakfast cereal suitable for serving with milk, fruits, and other breakfast ingredients.",
//         category: "Grocery",
//         price: 249,
//         attributes: {
//             brand: "Kellogg's",
//             weightGrams: 500,
//             type: "Corn Flakes",
//             vegetarian: true,
//         },
//     },
// ];

// // ============================================================
// // SEED FUNCTION
// // ============================================================

// async function seedProducts() {
//     console.log("🌱 Starting realistic product seeding...");

//     // Fetch existing merchants
//     const merchantList = await db
//         .select({
//             id: merchants.id,
//             name: merchants.name,
//         })
//         .from(merchants);

//     if (merchantList.length === 0) {
//         throw new Error(
//             "No merchants found. Seed merchants before seeding products.",
//         );
//     }

//     console.log(`🏪 Found ${merchantList.length} merchants.`);
//     console.log(`📦 Products to seed: ${productData.length}`);

//     const rows = productData.map((product, index) => {
//         // Distribute products across existing merchants
//         const merchant = merchantList[index % merchantList.length];

//         // Keep inventory realistic
//         const stockQty = 20 + ((index * 13) % 131);

//         return {
//             productName: product.productName,
//             description: product.description,

//             merchantId: merchant.id,

//             category: product.category,

//             price: product.price.toFixed(2),
//             currency: "INR",

//             attributes: {
//                 ...product.attributes,

//                 sku: `PROD-${String(index + 1).padStart(5, "0")}`,
//             },

//             inventoryStock: stockQty,
//             availableStock: stockQty,
//             reserveStock: 0,
//             soldStock: 0,
//         };
//     });

//     // Insert in batches
//     const BATCH_SIZE = 50;

//     for (let i = 0; i < rows.length; i += BATCH_SIZE) {
//         const batch = rows.slice(i, i + BATCH_SIZE);

//         await db.insert(products).values(batch);

//         console.log(
//             `✅ Inserted ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`,
//         );
//     }

//     console.log("🎉 Product seeding completed successfully.");

//     // Print category summary
//     const categoryCounts = productData.reduce(
//         (acc, product) => {
//             acc[product.category] = (acc[product.category] || 0) + 1;
//             return acc;
//         },
//         {} as Record<string, number>,
//     );

//     console.log("\n📊 Category summary:");

//     Object.entries(categoryCounts).forEach(([category, count]) => {
//         console.log(`   ${category}: ${count}`);
//     });
// }

// seedProducts()
//     .then(() => {
//         console.log("\n✅ Successfully seeded products.");
//     })
//     .catch((error) => {
//         console.error("❌ Product seeding failed:", error);
//         process.exit(1);
//     })
//     .finally(() => {
//         process.exit(0);
//     });