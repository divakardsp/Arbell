import "dotenv/config";

import { db } from "../lib/index";
import { merchants } from "../db/schema";

const merchantData = [
    // Electronics
    {
        name: "TechWorld",
        description: "Consumer electronics, gadgets, and smart devices",
    },
    {
        name: "ElectroMart",
        description: "Electronics and accessories from popular brands",
    },
    {
        name: "GadgetSphere",
        description: "Modern gadgets and electronic accessories",
    },

    // Clothing
    {
        name: "StyleHub",
        description: "Trendy clothing and everyday fashion",
    },
    {
        name: "UrbanWear",
        description: "Modern casual and streetwear clothing",
    },

    // Footwear
    {
        name: "SoleStreet",
        description: "Casual, sports, and lifestyle footwear",
    },
    {
        name: "FootFlex",
        description: "Comfortable footwear for everyday use",
    },
    {
        name: "StepUp",
        description: "Shoes and footwear for every occasion",
    },

    // Books
    {
        name: "BookNest",
        description: "Books, novels, educational resources, and bestsellers",
    },
    {
        name: "ReadersCorner",
        description: "Fiction, non-fiction, academic, and self-help books",
    },

    // Home & Kitchen
    {
        name: "HomeEssentials",
        description: "Kitchenware and everyday home essentials",
    },
    {
        name: "KitchenKart",
        description: "Cookware, kitchen tools, and dining essentials",
    },
    {
        name: "HomeLiving",
        description: "Products for comfortable and organized homes",
    },

    // Furniture
    {
        name: "FurniCraft",
        description: "Modern furniture for homes and offices",
    },
    {
        name: "WoodenSpace",
        description: "Wooden furniture and home furnishings",
    },

    // Beauty & Personal Care
    {
        name: "BeautyCare",
        description: "Skincare, haircare, and personal care products",
    },
    {
        name: "GlowStore",
        description: "Beauty and personal grooming products",
    },
    {
        name: "CarePlus",
        description: "Personal care and wellness essentials",
    },

    // Grocery
    {
        name: "GroceryMart",
        description: "Everyday groceries and household essentials",
    },
    {
        name: "FreshBasket",
        description: "Fresh food, groceries, and daily essentials",
    },

    // Sports & Fitness
    {
        name: "FitZone",
        description: "Fitness equipment, sports gear, and accessories",
    },
    {
        name: "SportSphere",
        description: "Sports equipment and active lifestyle products",
    },

    // Toys & Games
    {
        name: "ToyPlanet",
        description: "Toys, games, puzzles, and children's products",
    },
    {
        name: "GameWorld",
        description: "Board games, educational toys, and entertainment",
    },

    // Jewelry & Accessories
    {
        name: "JewelCraft",
        description: "Jewelry, watches, and fashion accessories",
    },
    {
        name: "AccessoryLane",
        description: "Fashion jewelry and everyday accessories",
    },

    // Bags & Luggage
    {
        name: "BagWorks",
        description: "Backpacks, handbags, travel bags, and luggage",
    },
    {
        name: "TravelGear",
        description: "Travel bags, suitcases, and outdoor luggage",
    },

    // Automotive
    {
        name: "AutoZone",
        description: "Automotive accessories and vehicle essentials",
    },
    {
        name: "MotorMart",
        description: "Car and motorcycle accessories and equipment",
    },

    // Mobile Phones
    {
        name: "MobileHub",
        description: "Smartphones, mobile accessories, and devices",
    },
    {
        name: "PhonePoint",
        description: "Mobile phones and smartphone accessories",
    },

    // Computers & Laptops
    {
        name: "ComputerWorld",
        description: "Laptops, desktops, and computer accessories",
    },
    {
        name: "PCWarehouse",
        description: "Computers, peripherals, and workstation equipment",
    },
    {
        name: "LaptopZone",
        description: "Laptops and computing accessories",
    },

    // Cameras & Photography
    {
        name: "PhotoPro",
        description: "Cameras, lenses, and photography equipment",
    },
    {
        name: "CameraWorld",
        description: "Digital cameras and photography accessories",
    },

    // Appliances
    {
        name: "ApplianceMart",
        description: "Home appliances and kitchen appliances",
    },
    {
        name: "SmartAppliances",
        description: "Modern and smart home appliances",
    },

    // Health & Wellness
    {
        name: "WellnessStore",
        description: "Health, fitness, and personal wellness products",
    },
    {
        name: "HealthMart",
        description: "Everyday health and wellness essentials",
    },
];

async function seedMerchants() {
    console.log("🌱 Seeding merchants...");

    const result = await db
        .insert(merchants)
        .values(merchantData)
        .onConflictDoNothing({
            target: merchants.name,
        })
        .returning({
            id: merchants.id,
            name: merchants.name,
        });

    console.log(`✅ ${result.length} new merchants inserted.`);
    console.log(`📦 Total merchants in seed data: ${merchantData.length}`);
}

seedMerchants()
    .then((data) => {
        console.log(data);
        console.log("Successfully Seed the dummy data");
    })
    .catch((error) => {
        console.error("❌ Error seeding merchants:", error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
