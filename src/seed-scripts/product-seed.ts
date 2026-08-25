import { db } from "../lib/index";
import { merchants, products } from "../db/schema";

const categories = [
    "Electronics",
    "Clothing",
    "Footwear",
    "Books",
    "Home & Kitchen",
    "Furniture",
    "Beauty & Personal Care",
    "Grocery",
    "Sports & Fitness",
    "Toys & Games",
    "Jewelry & Accessories",
    "Bags & Luggage",
    "Automotive",
    "Mobile Phones",
    "Computers & Laptops",
    "Cameras & Photography",
    "Appliances",
    "Health & Wellness",
] as const;

type Category = (typeof categories)[number];

type ProductTemplate = {
    name: string;
    description: string;
    minPrice: number;
    maxPrice: number;
    attributes: () => Record<string, string | number | boolean>;
};

const randomNumber = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomDecimal = (min: number, max: number) =>
    Math.round((Math.random() * (max - min) + min) * 100) / 100;

const randomChoice = <T>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

const randomBoolean = () => Math.random() > 0.5;

const productCatalog: Record<Category, ProductTemplate[]> = {
    Electronics: [
        {
            name: "Wireless Noise Cancelling Headphones",
            description:
                "Over-ear wireless headphones with active noise cancellation.",
            minPrice: 2999,
            maxPrice: 14999,
            attributes: () => ({
                brand: randomChoice(["Sony", "JBL", "Boat", "Sennheiser"]),
                connectivity: "Bluetooth 5.3",
                batteryLifeHours: randomNumber(20, 45),
                noiseCancellation: true,
                microphone: true,
            }),
        },
        {
            name: "Portable Bluetooth Speaker",
            description:
                "Compact wireless speaker designed for indoor and outdoor use.",
            minPrice: 1499,
            maxPrice: 8999,
            attributes: () => ({
                brand: randomChoice(["JBL", "Boat", "Sony", "Marshall"]),
                bluetoothVersion: "5.3",
                batteryLifeHours: randomNumber(8, 24),
                waterproof: randomBoolean(),
                wattOutput: randomNumber(10, 40),
            }),
        },
        {
            name: "Smart LED TV",
            description:
                "Smart television with streaming apps and high-definition display.",
            minPrice: 17999,
            maxPrice: 79999,
            attributes: () => ({
                brand: randomChoice(["Samsung", "LG", "Sony", "TCL"]),
                screenSizeInches: randomChoice([43, 50, 55, 65]),
                resolution: randomChoice(["4K UHD", "Full HD"]),
                refreshRateHz: randomChoice([60, 120]),
                smartTV: true,
            }),
        },
        {
            name: "Smartwatch",
            description:
                "Fitness-focused smartwatch with health tracking and notifications.",
            minPrice: 1999,
            maxPrice: 24999,
            attributes: () => ({
                brand: randomChoice(["Samsung", "Amazfit", "Noise", "Garmin"]),
                displayType: randomChoice(["AMOLED", "LCD"]),
                waterResistance: randomChoice(["5 ATM", "IP68"]),
                batteryDays: randomNumber(5, 14),
                heartRateMonitor: true,
            }),
        },
        {
            name: "Power Bank",
            description:
                "Portable fast-charging power bank for smartphones and accessories.",
            minPrice: 999,
            maxPrice: 4999,
            attributes: () => ({
                capacityMah: randomChoice([10000, 20000, 25000]),
                fastCharging: true,
                usbPorts: randomNumber(2, 3),
                pdSupport: randomBoolean(),
            }),
        },
    ],

    Clothing: [
        {
            name: "Men's Cotton Casual Shirt",
            description:
                "Comfortable regular-fit cotton shirt for everyday wear.",
            minPrice: 699,
            maxPrice: 2499,
            attributes: () => ({
                material: randomChoice([
                    "100% Cotton",
                    "Cotton Blend",
                    "Linen Blend",
                ]),
                fit: randomChoice(["Regular", "Slim", "Relaxed"]),
                size: randomChoice(["S", "M", "L", "XL", "XXL"]),
                washable: true,
            }),
        },
        {
            name: "Women's Casual Kurti",
            description:
                "Comfortable printed kurti suitable for everyday occasions.",
            minPrice: 599,
            maxPrice: 1999,
            attributes: () => ({
                material: randomChoice(["Cotton", "Rayon", "Viscose"]),
                size: randomChoice(["S", "M", "L", "XL"]),
                sleeve: randomChoice([
                    "Full Sleeve",
                    "Three Quarter",
                    "Short Sleeve",
                ]),
                machineWash: true,
            }),
        },
        {
            name: "Unisex Cotton Hoodie",
            description:
                "Warm cotton-blend hoodie designed for casual everyday wear.",
            minPrice: 999,
            maxPrice: 2999,
            attributes: () => ({
                material: "Cotton Blend",
                fit: randomChoice(["Regular", "Oversized"]),
                size: randomChoice(["S", "M", "L", "XL", "XXL"]),
                hooded: true,
            }),
        },
        {
            name: "Men's Denim Jeans",
            description: "Classic denim jeans with a comfortable everyday fit.",
            minPrice: 1199,
            maxPrice: 3499,
            attributes: () => ({
                material: "Denim",
                fit: randomChoice(["Slim", "Straight", "Tapered"]),
                waistSize: randomNumber(30, 38),
                stretch: randomBoolean(),
            }),
        },
        {
            name: "Women's Cotton T-Shirt",
            description:
                "Soft cotton everyday t-shirt with a relaxed silhouette.",
            minPrice: 499,
            maxPrice: 1499,
            attributes: () => ({
                material: "Cotton",
                fit: randomChoice(["Regular", "Relaxed", "Oversized"]),
                size: randomChoice(["S", "M", "L", "XL"]),
                neck: "Round",
            }),
        },
    ],

    Footwear: [
        {
            name: "Running Shoes",
            description:
                "Lightweight running shoes designed for daily training.",
            minPrice: 1499,
            maxPrice: 8999,
            attributes: () => ({
                material: randomChoice([
                    "Mesh",
                    "Engineered Mesh",
                    "Synthetic",
                ]),
                size: randomNumber(6, 11),
                sole: randomChoice(["EVA", "Rubber", "EVA + Rubber"]),
                lightweight: true,
            }),
        },
        {
            name: "Casual Sneakers",
            description:
                "Everyday sneakers combining comfort and casual styling.",
            minPrice: 1299,
            maxPrice: 6999,
            attributes: () => ({
                upper: randomChoice(["Mesh", "Synthetic Leather", "Canvas"]),
                size: randomNumber(6, 11),
                closure: "Lace-Up",
                unisex: true,
            }),
        },
        {
            name: "Leather Formal Shoes",
            description:
                "Classic formal shoes suitable for office and business occasions.",
            minPrice: 1999,
            maxPrice: 7999,
            attributes: () => ({
                material: "Leather",
                size: randomNumber(6, 11),
                sole: "Rubber",
                formal: true,
            }),
        },
        {
            name: "Sports Sandals",
            description:
                "Lightweight sandals designed for outdoor and casual activities.",
            minPrice: 799,
            maxPrice: 2999,
            attributes: () => ({
                material: "Synthetic",
                size: randomNumber(6, 11),
                adjustableStraps: true,
                waterResistant: randomBoolean(),
            }),
        },
        {
            name: "Everyday Flip Flops",
            description: "Comfortable lightweight flip flops for everyday use.",
            minPrice: 299,
            maxPrice: 999,
            attributes: () => ({
                material: "EVA",
                size: randomNumber(6, 11),
                washable: true,
                lightweight: true,
            }),
        },
    ],

    Books: [
        {
            name: "The Psychology of Money",
            description:
                "A practical book about money, investing, and financial behaviour.",
            minPrice: 299,
            maxPrice: 599,
            attributes: () => ({
                author: "Morgan Housel",
                format: randomChoice(["Paperback", "Hardcover"]),
                pages: randomNumber(200, 280),
                language: "English",
            }),
        },
        {
            name: "Atomic Habits",
            description:
                "A practical guide to building better habits and breaking bad ones.",
            minPrice: 299,
            maxPrice: 699,
            attributes: () => ({
                author: "James Clear",
                format: "Paperback",
                pages: randomNumber(280, 350),
                language: "English",
            }),
        },
        {
            name: "Clean Code",
            description:
                "A guide to writing readable, maintainable, and professional software.",
            minPrice: 499,
            maxPrice: 999,
            attributes: () => ({
                author: "Robert C. Martin",
                format: "Paperback",
                pages: randomNumber(400, 500),
                language: "English",
            }),
        },
        {
            name: "Deep Work",
            description:
                "Strategies for focused work and improving productivity.",
            minPrice: 299,
            maxPrice: 599,
            attributes: () => ({
                author: "Cal Newport",
                format: randomChoice(["Paperback", "Hardcover"]),
                pages: randomNumber(250, 320),
                language: "English",
            }),
        },
        {
            name: "Ikigai",
            description:
                "A book exploring Japanese ideas around purpose and meaningful living.",
            minPrice: 199,
            maxPrice: 499,
            attributes: () => ({
                author: randomChoice(["Hector Garcia", "Francesc Miralles"]),
                format: "Paperback",
                pages: randomNumber(180, 240),
                language: "English",
            }),
        },
    ],

    "Home & Kitchen": [
        {
            name: "Non-Stick Cookware Set",
            description: "Multi-piece cookware set for everyday home cooking.",
            minPrice: 1499,
            maxPrice: 5999,
            attributes: () => ({
                pieces: randomNumber(3, 8),
                material: "Aluminium",
                inductionCompatible: randomBoolean(),
                dishwasherSafe: randomBoolean(),
            }),
        },
        {
            name: "Stainless Steel Water Bottle",
            description:
                "Reusable insulated bottle for home, office, and travel.",
            minPrice: 499,
            maxPrice: 1999,
            attributes: () => ({
                capacityMl: randomChoice([750, 1000, 1200]),
                material: "Stainless Steel",
                insulated: true,
                leakProof: true,
            }),
        },
        {
            name: "Kitchen Storage Container Set",
            description: "Airtight containers for organized kitchen storage.",
            minPrice: 599,
            maxPrice: 2499,
            attributes: () => ({
                pieces: randomNumber(4, 12),
                material: "Food Grade Plastic",
                airtight: true,
                microwaveSafe: true,
            }),
        },
        {
            name: "Electric Kettle",
            description:
                "Fast-boiling electric kettle for tea, coffee, and hot water.",
            minPrice: 999,
            maxPrice: 2499,
            attributes: () => ({
                capacityLitres: randomChoice([1, 1.5, 1.7]),
                powerWatts: randomChoice([1200, 1500, 1800]),
                autoShutOff: true,
                material: "Stainless Steel",
            }),
        },
        {
            name: "Mixer Grinder",
            description:
                "Multi-purpose mixer grinder for everyday kitchen preparation.",
            minPrice: 1999,
            maxPrice: 6999,
            attributes: () => ({
                powerWatts: randomChoice([500, 750, 1000]),
                jars: randomNumber(2, 4),
                speedLevels: randomNumber(2, 5),
                overloadProtection: true,
            }),
        },
    ],

    Furniture: [
        {
            name: "Study Table",
            description:
                "Compact workstation suitable for study and home office use.",
            minPrice: 2999,
            maxPrice: 9999,
            attributes: () => ({
                material: randomChoice(["Engineered Wood", "Solid Wood"]),
                widthCm: randomNumber(90, 140),
                storageDrawers: randomNumber(0, 3),
                assemblyRequired: true,
            }),
        },
        {
            name: "Ergonomic Office Chair",
            description:
                "Adjustable office chair designed for long working sessions.",
            minPrice: 4999,
            maxPrice: 19999,
            attributes: () => ({
                material: randomChoice(["Mesh", "Fabric", "Leatherette"]),
                adjustableHeight: true,
                lumbarSupport: true,
                weightCapacityKg: randomNumber(100, 150),
            }),
        },
        {
            name: "Three-Seater Sofa",
            description: "Comfortable three-seater sofa for living rooms.",
            minPrice: 14999,
            maxPrice: 49999,
            attributes: () => ({
                material: randomChoice(["Fabric", "Leatherette"]),
                seats: 3,
                frameMaterial: "Engineered Wood",
                assemblyRequired: true,
            }),
        },
        {
            name: "Bedside Table",
            description: "Compact bedside storage table with drawers.",
            minPrice: 1999,
            maxPrice: 6999,
            attributes: () => ({
                material: randomChoice(["Engineered Wood", "Solid Wood"]),
                drawers: randomNumber(1, 3),
                widthCm: randomNumber(35, 55),
                assemblyRequired: true,
            }),
        },
        {
            name: "Bookshelf",
            description: "Multi-level bookshelf for home and office storage.",
            minPrice: 2499,
            maxPrice: 9999,
            attributes: () => ({
                material: "Engineered Wood",
                shelves: randomNumber(4, 7),
                heightCm: randomNumber(120, 190),
                assemblyRequired: true,
            }),
        },
    ],

    "Beauty & Personal Care": [
        {
            name: "Vitamin C Face Serum",
            description:
                "Lightweight facial serum designed for daily skincare routines.",
            minPrice: 399,
            maxPrice: 1499,
            attributes: () => ({
                volumeMl: randomChoice([20, 30, 50]),
                vitaminCPercent: randomChoice([5, 10, 15, 20]),
                skinType: randomChoice(["All", "Oily", "Combination", "Dry"]),
                parabenFree: true,
            }),
        },
        {
            name: "Moisturizing Face Cream",
            description:
                "Daily moisturizer designed to hydrate and protect the skin.",
            minPrice: 299,
            maxPrice: 1299,
            attributes: () => ({
                volumeGrams: randomChoice([50, 75, 100]),
                skinType: randomChoice(["All", "Dry", "Normal"]),
                fragranceFree: randomBoolean(),
                nonComedogenic: true,
            }),
        },
        {
            name: "Shampoo",
            description: "Daily-use shampoo for cleansing and hair care.",
            minPrice: 249,
            maxPrice: 999,
            attributes: () => ({
                volumeMl: randomChoice([250, 400, 650]),
                hairType: randomChoice(["Normal", "Dry", "Oily"]),
                sulfateFree: randomBoolean(),
                suitableForDailyUse: true,
            }),
        },
        {
            name: "Electric Hair Trimmer",
            description:
                "Rechargeable trimmer for beard and personal grooming.",
            minPrice: 699,
            maxPrice: 2999,
            attributes: () => ({
                batteryLifeMinutes: randomNumber(60, 180),
                waterproof: randomBoolean(),
                charging: "USB",
                adjustableLength: true,
            }),
        },
        {
            name: "Hair Dryer",
            description:
                "Compact hair dryer with multiple heat and speed settings.",
            minPrice: 999,
            maxPrice: 3999,
            attributes: () => ({
                powerWatts: randomChoice([1200, 1600, 1800, 2000]),
                heatSettings: randomNumber(2, 4),
                speedSettings: randomNumber(2, 3),
                coolShot: true,
            }),
        },
    ],

    Grocery: [
        {
            name: "Basmati Rice",
            description: "Premium long-grain basmati rice for everyday meals.",
            minPrice: 399,
            maxPrice: 999,
            attributes: () => ({
                weightKg: randomChoice([2, 5, 10]),
                grainType: "Long Grain",
                aged: randomBoolean(),
                vegetarian: true,
            }),
        },
        {
            name: "Cold Pressed Cooking Oil",
            description:
                "Premium cooking oil suitable for everyday Indian cooking.",
            minPrice: 299,
            maxPrice: 899,
            attributes: () => ({
                volumeLitres: randomChoice([1, 2, 5]),
                oilType: randomChoice(["Groundnut", "Mustard", "Sunflower"]),
                coldPressed: true,
                vegetarian: true,
            }),
        },
        {
            name: "Organic Whole Wheat Flour",
            description:
                "Whole wheat flour suitable for rotis and everyday cooking.",
            minPrice: 199,
            maxPrice: 499,
            attributes: () => ({
                weightKg: randomChoice([2, 5, 10]),
                organic: true,
                wholeGrain: true,
                vegetarian: true,
            }),
        },
        {
            name: "Green Tea",
            description:
                "Light and refreshing green tea for everyday consumption.",
            minPrice: 199,
            maxPrice: 599,
            attributes: () => ({
                teaBags: randomChoice([25, 50, 100]),
                flavour: randomChoice(["Classic", "Lemon", "Mint"]),
                caffeine: true,
                vegetarian: true,
            }),
        },
        {
            name: "Mixed Dry Fruits",
            description: "Premium mixed nuts and dried fruits for snacking.",
            minPrice: 399,
            maxPrice: 1499,
            attributes: () => ({
                weightGrams: randomChoice([250, 500, 1000]),
                contents: "Almonds, Cashews, Raisins, Pistachios",
                roasted: randomBoolean(),
                vegetarian: true,
            }),
        },
    ],

    "Sports & Fitness": [
        {
            name: "Adjustable Dumbbell Set",
            description:
                "Adjustable dumbbell set suitable for home strength training.",
            minPrice: 1999,
            maxPrice: 9999,
            attributes: () => ({
                weightKg: randomChoice([10, 15, 20, 30]),
                adjustable: true,
                material: "Cast Iron",
                pieces: 2,
            }),
        },
        {
            name: "Yoga Mat",
            description:
                "Non-slip exercise mat designed for yoga and floor workouts.",
            minPrice: 499,
            maxPrice: 2499,
            attributes: () => ({
                thicknessMm: randomChoice([4, 6, 8, 10]),
                material: randomChoice(["TPE", "PVC", "Natural Rubber"]),
                nonSlip: true,
                lengthCm: 183,
            }),
        },
        {
            name: "Cricket Bat",
            description:
                "English willow-style cricket bat for recreational and competitive play.",
            minPrice: 1999,
            maxPrice: 19999,
            attributes: () => ({
                material: randomChoice(["Kashmir Willow", "English Willow"]),
                size: randomChoice(["SH", "Harrow", "Size 6"]),
                weightKg: randomDecimal(1.1, 1.3),
                grip: "Rubber",
            }),
        },
        {
            name: "Football",
            description:
                "Durable training football suitable for outdoor matches.",
            minPrice: 599,
            maxPrice: 2999,
            attributes: () => ({
                size: 5,
                material: "Synthetic Leather",
                bladder: "Butyl",
                machineStitched: randomBoolean(),
            }),
        },
        {
            name: "Resistance Band Set",
            description:
                "Multi-level resistance bands for strength and mobility workouts.",
            minPrice: 499,
            maxPrice: 1999,
            attributes: () => ({
                bands: randomNumber(3, 6),
                resistanceKg: randomNumber(5, 40),
                latexFree: randomBoolean(),
                portable: true,
            }),
        },
    ],

    "Toys & Games": [
        {
            name: "Building Blocks Set",
            description: "Creative construction blocks for children.",
            minPrice: 499,
            maxPrice: 2499,
            attributes: () => ({
                pieces: randomNumber(100, 500),
                recommendedAge: "6+",
                material: "ABS Plastic",
                educational: true,
            }),
        },
        {
            name: "Remote Control Car",
            description: "Rechargeable remote-controlled toy car for children.",
            minPrice: 799,
            maxPrice: 3999,
            attributes: () => ({
                scale: randomChoice(["1:12", "1:16", "1:18"]),
                rechargeable: true,
                remoteRangeMeters: randomNumber(20, 50),
                recommendedAge: "8+",
            }),
        },
        {
            name: "Board Game",
            description:
                "Family-friendly strategy and entertainment board game.",
            minPrice: 399,
            maxPrice: 1999,
            attributes: () => ({
                players: randomChoice(["2-4", "2-6", "2-8"]),
                recommendedAge: "8+",
                playTimeMinutes: randomNumber(20, 60),
                educational: randomBoolean(),
            }),
        },
        {
            name: "Jigsaw Puzzle",
            description:
                "Detailed jigsaw puzzle designed for children and families.",
            minPrice: 299,
            maxPrice: 999,
            attributes: () => ({
                pieces: randomChoice([100, 300, 500, 1000]),
                recommendedAge: "8+",
                material: "Cardboard",
                educational: true,
            }),
        },
        {
            name: "Plush Toy",
            description: "Soft plush toy suitable for children and gifting.",
            minPrice: 399,
            maxPrice: 1999,
            attributes: () => ({
                heightCm: randomNumber(20, 50),
                material: "Soft Polyester",
                washable: true,
                recommendedAge: "3+",
            }),
        },
    ],

    "Jewelry & Accessories": [
        {
            name: "Stainless Steel Analog Watch",
            description:
                "Classic analog watch suitable for everyday and formal wear.",
            minPrice: 999,
            maxPrice: 6999,
            attributes: () => ({
                caseMaterial: "Stainless Steel",
                strap: randomChoice(["Leather", "Metal", "Silicone"]),
                waterResistance: randomChoice(["3 ATM", "5 ATM"]),
                movement: "Quartz",
            }),
        },
        {
            name: "Minimalist Pendant Necklace",
            description:
                "Minimal pendant necklace designed for everyday styling.",
            minPrice: 499,
            maxPrice: 2999,
            attributes: () => ({
                material: randomChoice([
                    "Stainless Steel",
                    "925 Silver",
                    "Alloy",
                ]),
                chainLengthCm: randomNumber(40, 50),
                hypoallergenic: randomBoolean(),
                plated: true,
            }),
        },
        {
            name: "Fashion Bracelet",
            description:
                "Lightweight bracelet suitable for casual and festive styling.",
            minPrice: 299,
            maxPrice: 1999,
            attributes: () => ({
                material: randomChoice(["Stainless Steel", "Leather", "Alloy"]),
                adjustable: true,
                unisex: true,
                handmade: randomBoolean(),
            }),
        },
        {
            name: "Sunglasses",
            description: "UV-protected sunglasses for everyday outdoor use.",
            minPrice: 499,
            maxPrice: 3999,
            attributes: () => ({
                frameMaterial: randomChoice([
                    "Acetate",
                    "Polycarbonate",
                    "Metal",
                ]),
                uvProtection: "UV400",
                polarized: randomBoolean(),
                lensColor: randomChoice(["Black", "Brown", "Blue"]),
            }),
        },
        {
            name: "Fashion Earrings",
            description:
                "Lightweight earrings suitable for casual and occasion wear.",
            minPrice: 299,
            maxPrice: 2499,
            attributes: () => ({
                material: randomChoice([
                    "Stainless Steel",
                    "Alloy",
                    "925 Silver",
                ]),
                hypoallergenic: randomBoolean(),
                plating: randomChoice(["Gold", "Rose Gold", "Silver"]),
                pair: true,
            }),
        },
    ],

    "Bags & Luggage": [
        {
            name: "Laptop Backpack",
            description:
                "Water-resistant backpack with a dedicated laptop compartment.",
            minPrice: 999,
            maxPrice: 4999,
            attributes: () => ({
                capacityLitres: randomChoice([20, 25, 30]),
                laptopSizeInches: randomChoice([15.6, 16]),
                waterResistant: true,
                usbPort: randomBoolean(),
            }),
        },
        {
            name: "Hard Shell Suitcase",
            description: "Durable hard-shell suitcase designed for travel.",
            minPrice: 2499,
            maxPrice: 9999,
            attributes: () => ({
                capacityLitres: randomChoice([55, 65, 75, 90]),
                material: "Polycarbonate",
                wheels: 4,
                tsaLock: true,
            }),
        },
        {
            name: "Travel Duffel Bag",
            description: "Spacious duffel bag for short trips and gym use.",
            minPrice: 799,
            maxPrice: 3499,
            attributes: () => ({
                capacityLitres: randomChoice([30, 40, 50]),
                material: "Polyester",
                waterResistant: randomBoolean(),
                shoulderStrap: true,
            }),
        },
        {
            name: "Leather Wallet",
            description: "Compact everyday wallet with multiple card slots.",
            minPrice: 499,
            maxPrice: 2999,
            attributes: () => ({
                material: "Genuine Leather",
                cardSlots: randomNumber(4, 10),
                cashCompartment: true,
                rfidProtection: randomBoolean(),
            }),
        },
        {
            name: "Sling Bag",
            description: "Compact crossbody sling bag for everyday essentials.",
            minPrice: 599,
            maxPrice: 2499,
            attributes: () => ({
                material: randomChoice(["Polyester", "Nylon", "Faux Leather"]),
                capacityLitres: randomNumber(3, 8),
                waterResistant: randomBoolean(),
                adjustableStrap: true,
            }),
        },
    ],

    Automotive: [
        {
            name: "Car Dash Camera",
            description:
                "Compact dashboard camera for recording road journeys.",
            minPrice: 2999,
            maxPrice: 9999,
            attributes: () => ({
                resolution: randomChoice(["1080p", "2K", "4K"]),
                nightVision: true,
                loopRecording: true,
                wifi: randomBoolean(),
            }),
        },
        {
            name: "Car Vacuum Cleaner",
            description:
                "Portable vacuum cleaner for cleaning vehicle interiors.",
            minPrice: 999,
            maxPrice: 3999,
            attributes: () => ({
                powerWatts: randomChoice([80, 100, 120, 150]),
                cordless: randomBoolean(),
                batteryMinutes: randomNumber(20, 40),
                attachments: randomNumber(3, 6),
            }),
        },
        {
            name: "Car Phone Holder",
            description: "Adjustable smartphone mount for use inside vehicles.",
            minPrice: 299,
            maxPrice: 1499,
            attributes: () => ({
                mounting: randomChoice(["Dashboard", "Air Vent", "Windshield"]),
                rotationDegrees: 360,
                oneHandOperation: true,
                compatibleWithMostPhones: true,
            }),
        },
        {
            name: "Car Air Compressor",
            description:
                "Portable electric tyre inflator for cars and motorcycles.",
            minPrice: 1499,
            maxPrice: 4999,
            attributes: () => ({
                maxPressurePsi: randomChoice([100, 120, 150]),
                digitalDisplay: true,
                autoStop: true,
                powerSource: "12V DC",
            }),
        },
        {
            name: "Car Cleaning Kit",
            description:
                "Multi-piece cleaning kit for vehicle interiors and exteriors.",
            minPrice: 499,
            maxPrice: 1999,
            attributes: () => ({
                pieces: randomNumber(8, 20),
                microfiberCloths: randomNumber(2, 6),
                brushes: randomNumber(2, 5),
                reusable: true,
            }),
        },
    ],

    "Mobile Phones": [
        {
            name: "Android Smartphone",
            description:
                "Modern Android smartphone with a high-refresh-rate display.",
            minPrice: 11999,
            maxPrice: 79999,
            attributes: () => ({
                brand: randomChoice([
                    "Samsung",
                    "OnePlus",
                    "Xiaomi",
                    "Motorola",
                ]),
                ramGB: randomChoice([6, 8, 12]),
                storageGB: randomChoice([128, 256, 512]),
                batteryMah: randomChoice([4500, 5000, 5500]),
                fiveG: true,
            }),
        },
        {
            name: "Budget Smartphone",
            description:
                "Affordable smartphone designed for everyday communication and entertainment.",
            minPrice: 6999,
            maxPrice: 15999,
            attributes: () => ({
                brand: randomChoice(["Redmi", "Realme", "Samsung", "Motorola"]),
                ramGB: randomChoice([4, 6, 8]),
                storageGB: randomChoice([64, 128, 256]),
                batteryMah: randomChoice([5000, 5200, 5500]),
                fiveG: randomBoolean(),
            }),
        },
        {
            name: "Premium Smartphone",
            description:
                "Flagship smartphone with premium camera and performance hardware.",
            minPrice: 49999,
            maxPrice: 149999,
            attributes: () => ({
                brand: randomChoice(["Apple", "Samsung", "Google", "OnePlus"]),
                ramGB: randomChoice([8, 12, 16]),
                storageGB: randomChoice([256, 512, 1024]),
                display: "AMOLED",
                wirelessCharging: randomBoolean(),
            }),
        },
        {
            name: "Smartphone Case",
            description:
                "Protective smartphone case with shock-resistant construction.",
            minPrice: 299,
            maxPrice: 1499,
            attributes: () => ({
                material: randomChoice(["TPU", "Polycarbonate", "Silicone"]),
                shockProtection: true,
                wirelessChargingCompatible: true,
                transparent: randomBoolean(),
            }),
        },
        {
            name: "Fast USB-C Charger",
            description:
                "Compact fast charger compatible with modern smartphones.",
            minPrice: 699,
            maxPrice: 2499,
            attributes: () => ({
                powerWatts: randomChoice([25, 33, 45, 65]),
                port: "USB-C",
                pdSupport: true,
                galliumNitride: randomBoolean(),
            }),
        },
    ],

    "Computers & Laptops": [
        {
            name: "Thin and Light Laptop",
            description:
                "Portable laptop designed for productivity, coding, and everyday use.",
            minPrice: 44999,
            maxPrice: 99999,
            attributes: () => ({
                brand: randomChoice(["HP", "Dell", "Lenovo", "ASUS"]),
                ramGB: randomChoice([8, 16]),
                storageGB: 512,
                storageType: "NVMe SSD",
                displayInches: randomChoice([14, 15.6]),
            }),
        },
        {
            name: "Gaming Laptop",
            description:
                "High-performance laptop with dedicated graphics for gaming and creative work.",
            minPrice: 64999,
            maxPrice: 179999,
            attributes: () => ({
                brand: randomChoice(["ASUS", "Lenovo", "Acer", "MSI"]),
                ramGB: randomChoice([16, 32]),
                storageGB: randomChoice([512, 1024]),
                gpu: randomChoice(["RTX 4050", "RTX 4060", "RTX 4070"]),
                refreshRateHz: randomChoice([144, 165, 240]),
            }),
        },
        {
            name: "Wireless Mechanical Keyboard",
            description:
                "Mechanical keyboard suitable for gaming and productivity.",
            minPrice: 1999,
            maxPrice: 9999,
            attributes: () => ({
                switches: randomChoice(["Red", "Brown", "Blue"]),
                connectivity: randomChoice([
                    "Bluetooth",
                    "2.4GHz",
                    "Bluetooth + 2.4GHz",
                ]),
                backlit: true,
                wireless: true,
            }),
        },
        {
            name: "Wireless Gaming Mouse",
            description:
                "Low-latency wireless mouse designed for gaming and productivity.",
            minPrice: 1499,
            maxPrice: 6999,
            attributes: () => ({
                dpi: randomChoice([8000, 12000, 16000, 26000]),
                wireless: true,
                buttons: randomNumber(5, 8),
                rechargeable: true,
            }),
        },
        {
            name: "27-inch Monitor",
            description:
                "High-resolution monitor suitable for productivity and entertainment.",
            minPrice: 12999,
            maxPrice: 39999,
            attributes: () => ({
                screenSizeInches: 27,
                resolution: randomChoice(["1440p", "4K"]),
                refreshRateHz: randomChoice([60, 75, 144]),
                panel: randomChoice(["IPS", "VA"]),
            }),
        },
    ],

    "Cameras & Photography": [
        {
            name: "Mirrorless Camera",
            description:
                "Interchangeable-lens mirrorless camera for photography and video.",
            minPrice: 49999,
            maxPrice: 149999,
            attributes: () => ({
                brand: randomChoice(["Sony", "Canon", "Nikon", "Fujifilm"]),
                sensor: "APS-C",
                videoResolution: randomChoice(["4K", "4K 60fps"]),
                interchangeableLens: true,
            }),
        },
        {
            name: "Full Frame Camera",
            description:
                "Professional full-frame camera for photography and video production.",
            minPrice: 99999,
            maxPrice: 299999,
            attributes: () => ({
                brand: randomChoice(["Sony", "Canon", "Nikon"]),
                sensor: "Full Frame",
                videoResolution: "4K",
                weatherSealed: randomBoolean(),
            }),
        },
        {
            name: "Camera Lens",
            description:
                "Interchangeable camera lens for portrait and general photography.",
            minPrice: 19999,
            maxPrice: 129999,
            attributes: () => ({
                focalLengthMm: randomChoice([24, 35, 50, 85]),
                aperture: randomChoice(["f/1.4", "f/1.8", "f/2.8"]),
                mount: randomChoice(["Sony E", "Canon RF", "Nikon Z"]),
                autofocus: true,
            }),
        },
        {
            name: "Camera Tripod",
            description:
                "Adjustable tripod for stable photography and video recording.",
            minPrice: 1499,
            maxPrice: 7999,
            attributes: () => ({
                maxHeightCm: randomNumber(140, 180),
                material: randomChoice(["Aluminium", "Carbon Fiber"]),
                loadCapacityKg: randomNumber(3, 10),
                quickRelease: true,
            }),
        },
        {
            name: "Action Camera",
            description:
                "Compact action camera designed for travel and outdoor recording.",
            minPrice: 4999,
            maxPrice: 39999,
            attributes: () => ({
                videoResolution: randomChoice(["4K", "5.3K"]),
                stabilization: true,
                waterproofDepthMeters: randomChoice([10, 20]),
                wifi: true,
            }),
        },
    ],

    Appliances: [
        {
            name: "Double Door Refrigerator",
            description:
                "Energy-efficient refrigerator with spacious storage compartments.",
            minPrice: 24999,
            maxPrice: 69999,
            attributes: () => ({
                capacityLitres: randomChoice([250, 300, 350, 450]),
                energyRating: randomChoice([2, 3, 4, 5]),
                inverterCompressor: true,
                frostFree: true,
            }),
        },
        {
            name: "Front Load Washing Machine",
            description:
                "Automatic washing machine with multiple wash programs.",
            minPrice: 24999,
            maxPrice: 59999,
            attributes: () => ({
                capacityKg: randomChoice([7, 8, 9]),
                energyRating: randomChoice([3, 4, 5]),
                rpm: randomChoice([1000, 1200, 1400]),
                inverterMotor: true,
            }),
        },
        {
            name: "Microwave Oven",
            description: "Multi-function microwave for reheating and cooking.",
            minPrice: 6999,
            maxPrice: 24999,
            attributes: () => ({
                capacityLitres: randomChoice([20, 25, 28, 32]),
                powerWatts: randomChoice([800, 1000, 1200]),
                type: randomChoice(["Solo", "Grill", "Convection"]),
                digitalDisplay: true,
            }),
        },
        {
            name: "Split Air Conditioner",
            description:
                "Energy-efficient split AC designed for residential cooling.",
            minPrice: 29999,
            maxPrice: 69999,
            attributes: () => ({
                capacityTon: randomChoice([1, 1.5, 2]),
                energyRating: randomChoice([3, 4, 5]),
                inverter: true,
                wifi: randomBoolean(),
            }),
        },
        {
            name: "Air Purifier",
            description: "Compact air purifier with multi-stage filtration.",
            minPrice: 4999,
            maxPrice: 24999,
            attributes: () => ({
                coverageSqFt: randomNumber(250, 700),
                filter: "HEPA",
                airQualitySensor: true,
                wifi: randomBoolean(),
            }),
        },
    ],

    "Health & Wellness": [
        {
            name: "Digital Blood Pressure Monitor",
            description:
                "Automatic digital monitor for home blood pressure tracking.",
            minPrice: 999,
            maxPrice: 3999,
            attributes: () => ({
                measurement: "Upper Arm",
                memoryReadings: randomNumber(60, 120),
                irregularHeartbeatDetection: true,
                batteryPowered: true,
            }),
        },
        {
            name: "Digital Weighing Scale",
            description: "Smart digital scale for monitoring body weight.",
            minPrice: 699,
            maxPrice: 2999,
            attributes: () => ({
                maxWeightKg: randomChoice([150, 180, 200]),
                bluetooth: randomBoolean(),
                bodyComposition: randomBoolean(),
                display: "LED",
            }),
        },
        {
            name: "Massage Gun",
            description:
                "Portable percussion massager designed for post-workout recovery.",
            minPrice: 1499,
            maxPrice: 7999,
            attributes: () => ({
                speedLevels: randomNumber(4, 8),
                attachments: randomNumber(4, 8),
                batteryHours: randomNumber(3, 8),
                rechargeable: true,
            }),
        },
        {
            name: "Foam Roller",
            description:
                "High-density foam roller for stretching and muscle recovery.",
            minPrice: 499,
            maxPrice: 1999,
            attributes: () => ({
                lengthCm: randomChoice([30, 45, 60, 90]),
                material: "EVA Foam",
                textured: randomBoolean(),
                portable: true,
            }),
        },
        {
            name: "Electric Heating Pad",
            description:
                "Reusable heating pad for general comfort and relaxation.",
            minPrice: 599,
            maxPrice: 1999,
            attributes: () => ({
                powerWatts: randomChoice([40, 50, 60]),
                heatLevels: randomNumber(2, 5),
                autoShutOffMinutes: randomChoice([30, 45, 60]),
                washableCover: true,
            }),
        },
    ],
};

function createProduct(
    merchantId: string,
    merchantName: string,
    category: Category,
    template: ProductTemplate,
    merchantIndex: number,
    productIndex: number,
) {
    const price = randomDecimal(template.minPrice, template.maxPrice);
    const stockQty = randomNumber(0, 150);

    return {
        productName: `${template.name} - ${merchantName}`,
        description: template.description,
        merchantId,
        category,
        price: price.toFixed(2),
        currency: "INR",
        attributes: {
            ...template.attributes(),
            sku: `${category
                .replace(/[^a-zA-Z0-9]/g, "")
                .slice(0, 5)
                .toUpperCase()}-${merchantIndex + 1}-${productIndex + 1}-${randomNumber(
                1000,
                9999,
            )}`,
        },
        inventoryStock: stockQty,
        availableStock: stockQty,
        reserveStock: 0,
        soldStock: 0,
    };
}

async function seedProducts() {
    console.log("🌱 Starting product seeding...");

    // 1. Fetch existing merchants.
    const merchantList = await db
        .select({
            id: merchants.id,
            name: merchants.name,
        })
        .from(merchants);

    if (merchantList.length === 0) {
        throw new Error(
            "No merchants found. Seed merchants before seeding products.",
        );
    }

    console.log(`🏪 Found ${merchantList.length} merchants.`);

    const productData = [];

    // 2. Generate 5 products for every merchant.
    for (
        let merchantIndex = 0;
        merchantIndex < merchantList.length;
        merchantIndex++
    ) {
        const merchant = merchantList[merchantIndex];

        for (let productIndex = 0; productIndex < 5; productIndex++) {
            /*
             * This guarantees that all 18 categories are eventually
             * represented instead of relying purely on randomness.
             */
            const categoryIndex =
                (merchantIndex * 5 + productIndex) % categories.length;

            const category = categories[categoryIndex];

            const templates = productCatalog[category];

            const template = randomChoice(templates);

            productData.push(
                createProduct(
                    merchant.id,
                    merchant.name,
                    category,
                    template,
                    merchantIndex,
                    productIndex,
                ),
            );
        }
    }

    console.log(`📦 Generated ${productData.length} products.`);

    // 3. Insert products in batches.
    const BATCH_SIZE = 100;

    for (let i = 0; i < productData.length; i += BATCH_SIZE) {
        const batch = productData.slice(i, i + BATCH_SIZE);

        await db.insert(products).values(batch);

        console.log(
            `✅ Inserted ${Math.min(i + BATCH_SIZE, productData.length)} / ${productData.length}`,
        );
    }

    console.log("🎉 Product seeding completed successfully.");
}

seedProducts()
    .catch((error) => {
        console.error("❌ Product seeding failed:", error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
