
import "dotenv/config";

import { db } from "../lib/index";
import { merchants, products } from "../db/schema";

type ProductSeed = {
    productName: string;
    description: string;
    category:
    | "Electronics"
    | "Mobile Phones"
    | "Computers & Laptops";
    price: number;
    attributes: Record<string, string | number | boolean>;
};

const productData: ProductSeed[] = [
    // ============================================================
    // MOBILE PHONES
    // ============================================================

    {
        productName: "Apple iPhone 16",
        description:
            "Apple smartphone with A18 chip, 48MP Fusion camera, Super Retina XDR display, and USB-C connectivity.",
        category: "Mobile Phones",
        price: 69999,
        attributes: {
            brand: "Apple",
            model: "iPhone 16",
            ramGB: 8,
            storageGB: 128,
            display: "6.1-inch Super Retina XDR OLED",
            processor: "Apple A18",
            cameraMP: 48,
            fiveG: true,
            usbPort: "USB-C",
        },
    },
    {
        productName: "Apple iPhone 16 Pro",
        description:
            "Premium Apple smartphone featuring an A18 Pro chip, ProMotion OLED display, titanium design, and advanced camera system.",
        category: "Mobile Phones",
        price: 119999,
        attributes: {
            brand: "Apple",
            model: "iPhone 16 Pro",
            ramGB: 8,
            storageGB: 128,
            display: "6.3-inch Super Retina XDR OLED",
            processor: "Apple A18 Pro",
            cameraMP: 48,
            refreshRateHz: 120,
            fiveG: true,
            usbPort: "USB-C",
        },
    },
    {
        productName: "Apple iPhone 16 Pro Max",
        description:
            "Large-screen flagship iPhone with A18 Pro performance, ProMotion display, titanium construction, and professional camera features.",
        category: "Mobile Phones",
        price: 144999,
        attributes: {
            brand: "Apple",
            model: "iPhone 16 Pro Max",
            ramGB: 8,
            storageGB: 256,
            display: "6.9-inch Super Retina XDR OLED",
            processor: "Apple A18 Pro",
            cameraMP: 48,
            refreshRateHz: 120,
            fiveG: true,
            usbPort: "USB-C",
        },
    },
    {
        productName: "Apple iPhone 15",
        description:
            "Premium everyday iPhone with A16 Bionic performance, Dynamic Island, 48MP main camera, and USB-C connectivity.",
        category: "Mobile Phones",
        price: 59999,
        attributes: {
            brand: "Apple",
            model: "iPhone 15",
            ramGB: 6,
            storageGB: 128,
            display: "6.1-inch Super Retina XDR OLED",
            processor: "Apple A16 Bionic",
            cameraMP: 48,
            fiveG: true,
            usbPort: "USB-C",
        },
    },
    {
        productName: "Samsung Galaxy S25",
        description:
            "Flagship Samsung Galaxy smartphone with Snapdragon performance, AMOLED display, advanced cameras, and 5G connectivity.",
        category: "Mobile Phones",
        price: 80999,
        attributes: {
            brand: "Samsung",
            model: "Galaxy S25",
            ramGB: 12,
            storageGB: 256,
            display: "6.2-inch Dynamic AMOLED 2X",
            processor: "Snapdragon 8 Elite",
            cameraMP: 50,
            refreshRateHz: 120,
            fiveG: true,
            wirelessCharging: true,
        },
    },
    {
        productName: "Samsung Galaxy S25 Ultra",
        description:
            "Ultra-premium Samsung smartphone with a large QHD+ AMOLED display, high-end Snapdragon processor, S Pen support, and versatile camera system.",
        category: "Mobile Phones",
        price: 129999,
        attributes: {
            brand: "Samsung",
            model: "Galaxy S25 Ultra",
            ramGB: 12,
            storageGB: 256,
            display: "6.9-inch Dynamic AMOLED 2X",
            processor: "Snapdragon 8 Elite",
            cameraMP: 200,
            refreshRateHz: 120,
            fiveG: true,
            sPenSupport: true,
            wirelessCharging: true,
        },
    },
    {
        productName: "Samsung Galaxy A56 5G",
        description:
            "Mid-range Samsung smartphone with Super AMOLED display, 5G connectivity, large battery, and versatile cameras.",
        category: "Mobile Phones",
        price: 41999,
        attributes: {
            brand: "Samsung",
            model: "Galaxy A56 5G",
            ramGB: 8,
            storageGB: 128,
            display: "6.7-inch Super AMOLED",
            processor: "Exynos",
            cameraMP: 50,
            batteryMah: 5000,
            fiveG: true,
        },
    },
    {
        productName: "OnePlus 13",
        description:
            "High-performance OnePlus flagship with Snapdragon processor, high-refresh-rate AMOLED display, and fast charging.",
        category: "Mobile Phones",
        price: 69999,
        attributes: {
            brand: "OnePlus",
            model: "OnePlus 13",
            ramGB: 12,
            storageGB: 256,
            display: "6.82-inch AMOLED",
            processor: "Snapdragon 8 Elite",
            cameraMP: 50,
            refreshRateHz: 120,
            batteryMah: 6000,
            fiveG: true,
        },
    },
    {
        productName: "OnePlus Nord 5",
        description:
            "Performance-focused OnePlus smartphone designed for gaming, entertainment, and everyday productivity.",
        category: "Mobile Phones",
        price: 33999,
        attributes: {
            brand: "OnePlus",
            model: "Nord 5",
            ramGB: 8,
            storageGB: 128,
            display: "AMOLED",
            refreshRateHz: 144,
            batteryMah: 6800,
            fiveG: true,
        },
    },
    {
        productName: "Google Pixel 9",
        description:
            "Google Pixel smartphone featuring advanced computational photography, clean Android software, and Tensor processing.",
        category: "Mobile Phones",
        price: 79999,
        attributes: {
            brand: "Google",
            model: "Pixel 9",
            ramGB: 12,
            storageGB: 256,
            display: "6.3-inch OLED",
            processor: "Google Tensor G4",
            cameraMP: 50,
            refreshRateHz: 120,
            fiveG: true,
        },
    },
    {
        productName: "Google Pixel 9 Pro",
        description:
            "Premium Pixel smartphone with Pro camera hardware, Tensor G4 processor, LTPO OLED display, and advanced AI features.",
        category: "Mobile Phones",
        price: 109999,
        attributes: {
            brand: "Google",
            model: "Pixel 9 Pro",
            ramGB: 16,
            storageGB: 256,
            display: "6.3-inch LTPO OLED",
            processor: "Google Tensor G4",
            cameraMP: 50,
            refreshRateHz: 120,
            fiveG: true,
        },
    },
    {
        productName: "Xiaomi 15",
        description:
            "Compact Xiaomi flagship smartphone with Snapdragon flagship performance, AMOLED display, and Leica-inspired camera system.",
        category: "Mobile Phones",
        price: 64999,
        attributes: {
            brand: "Xiaomi",
            model: "Xiaomi 15",
            ramGB: 12,
            storageGB: 256,
            display: "6.36-inch AMOLED",
            processor: "Snapdragon 8 Elite",
            cameraMP: 50,
            refreshRateHz: 120,
            fiveG: true,
        },
    },

    // ============================================================
    // MACBOOKS
    // ============================================================

    {
        productName: "Apple MacBook Air 13-inch M4",
        description:
            "Thin and lightweight MacBook Air powered by Apple's M4 chip, designed for development, productivity, and everyday computing.",
        category: "Computers & Laptops",
        price: 99999,
        attributes: {
            brand: "Apple",
            model: "MacBook Air 13-inch M4",
            processor: "Apple M4",
            ramGB: 16,
            storageGB: 256,
            display: "13.6-inch Liquid Retina",
            operatingSystem: "macOS",
            usbPorts: 2,
            thunderbolt: true,
        },
    },
    {
        productName: "Apple MacBook Air 15-inch M4",
        description:
            "Large-screen MacBook Air powered by the Apple M4 chip with a spacious Liquid Retina display and long battery life.",
        category: "Computers & Laptops",
        price: 119999,
        attributes: {
            brand: "Apple",
            model: "MacBook Air 15-inch M4",
            processor: "Apple M4",
            ramGB: 16,
            storageGB: 256,
            display: "15.3-inch Liquid Retina",
            operatingSystem: "macOS",
            usbPorts: 2,
            thunderbolt: true,
        },
    },
    {
        productName: "Apple MacBook Air 13-inch M4 512GB",
        description:
            "Portable MacBook Air with M4 performance, 16GB unified memory, and 512GB SSD storage for demanding productivity workloads.",
        category: "Computers & Laptops",
        price: 119999,
        attributes: {
            brand: "Apple",
            model: "MacBook Air 13-inch M4",
            processor: "Apple M4",
            ramGB: 16,
            storageGB: 512,
            display: "13.6-inch Liquid Retina",
            operatingSystem: "macOS",
            usbPorts: 2,
        },
    },
    {
        productName: "Apple MacBook Pro 14-inch M4",
        description:
            "Professional 14-inch MacBook Pro with M4 performance, Liquid Retina XDR display, and Thunderbolt connectivity.",
        category: "Computers & Laptops",
        price: 169999,
        attributes: {
            brand: "Apple",
            model: "MacBook Pro 14-inch M4",
            processor: "Apple M4",
            ramGB: 16,
            storageGB: 512,
            display: "14.2-inch Liquid Retina XDR",
            operatingSystem: "macOS",
            refreshRateHz: 120,
            thunderbolt: true,
        },
    },
    {
        productName: "Apple MacBook Pro 14-inch M4 Pro",
        description:
            "Professional MacBook Pro configured with the M4 Pro chip, high-bandwidth memory, and fast SSD storage for development and creative workloads.",
        category: "Computers & Laptops",
        price: 199999,
        attributes: {
            brand: "Apple",
            model: "MacBook Pro 14-inch M4 Pro",
            processor: "Apple M4 Pro",
            ramGB: 24,
            storageGB: 512,
            display: "14.2-inch Liquid Retina XDR",
            refreshRateHz: 120,
            thunderbolt: true,
        },
    },

    // ============================================================
    // WINDOWS LAPTOPS
    // ============================================================

    {
        productName: "Dell XPS 13",
        description:
            "Premium compact Windows laptop designed for professional productivity, programming, and portable computing.",
        category: "Computers & Laptops",
        price: 119999,
        attributes: {
            brand: "Dell",
            model: "XPS 13",
            processor: "Intel Core Ultra",
            ramGB: 16,
            storageGB: 512,
            display: "13.4-inch",
            operatingSystem: "Windows 11",
            usbPorts: 2,
        },
    },
    {
        productName: "Dell Inspiron 14",
        description:
            "Everyday productivity laptop suitable for office work, development, browsing, and entertainment.",
        category: "Computers & Laptops",
        price: 64999,
        attributes: {
            brand: "Dell",
            model: "Inspiron 14",
            processor: "Intel Core 5",
            ramGB: 16,
            storageGB: 512,
            display: "14-inch Full HD",
            operatingSystem: "Windows 11",
        },
    },
    {
        productName: "HP Pavilion 14",
        description:
            "Slim everyday laptop designed for students, office work, coding, and general productivity.",
        category: "Computers & Laptops",
        price: 59999,
        attributes: {
            brand: "HP",
            model: "Pavilion 14",
            processor: "Intel Core 5",
            ramGB: 16,
            storageGB: 512,
            display: "14-inch Full HD",
            operatingSystem: "Windows 11",
        },
    },
    {
        productName: "HP Spectre x360 14",
        description:
            "Premium convertible laptop with touchscreen display, flexible 2-in-1 design, and high-performance hardware.",
        category: "Computers & Laptops",
        price: 139999,
        attributes: {
            brand: "HP",
            model: "Spectre x360 14",
            processor: "Intel Core Ultra",
            ramGB: 16,
            storageGB: 512,
            display: "14-inch OLED Touch",
            operatingSystem: "Windows 11",
            touchscreen: true,
            convertible: true,
        },
    },
    {
        productName: "Lenovo ThinkPad T14",
        description:
            "Business-class ThinkPad laptop designed for professional productivity, software development, and enterprise workloads.",
        category: "Computers & Laptops",
        price: 89999,
        attributes: {
            brand: "Lenovo",
            model: "ThinkPad T14",
            processor: "AMD Ryzen 7",
            ramGB: 16,
            storageGB: 512,
            display: "14-inch",
            operatingSystem: "Windows 11 Pro",
        },
    },
    {
        productName: "Lenovo Legion 5",
        description:
            "Gaming laptop with dedicated NVIDIA graphics, high-refresh-rate display, and powerful cooling for demanding workloads.",
        category: "Computers & Laptops",
        price: 114999,
        attributes: {
            brand: "Lenovo",
            model: "Legion 5",
            processor: "AMD Ryzen 7",
            ramGB: 16,
            storageGB: 1024,
            gpu: "NVIDIA GeForce RTX 4060",
            refreshRateHz: 165,
            operatingSystem: "Windows 11",
        },
    },
    {
        productName: "ASUS ROG Strix G16",
        description:
            "High-performance gaming laptop with dedicated RTX graphics, fast display, and powerful processor for gaming and content creation.",
        category: "Computers & Laptops",
        price: 129999,
        attributes: {
            brand: "ASUS",
            model: "ROG Strix G16",
            processor: "Intel Core i9",
            ramGB: 16,
            storageGB: 1024,
            gpu: "NVIDIA GeForce RTX 4060",
            refreshRateHz: 165,
            operatingSystem: "Windows 11",
        },
    },

    // ============================================================
    // IPADS / TABLETS
    // ============================================================

    {
        productName: "Apple iPad 11th Generation",
        description:
            "Versatile iPad powered by Apple silicon for browsing, entertainment, note-taking, productivity, and everyday tablet use.",
        category: "Computers & Laptops",
        price: 34999,
        attributes: {
            brand: "Apple",
            model: "iPad 11th Generation",
            storageGB: 128,
            display: "11-inch Liquid Retina",
            operatingSystem: "iPadOS",
            usbPort: "USB-C",
            wifi: true,
        },
    },
    {
        productName: "Apple iPad Air 11-inch M3",
        description:
            "Powerful iPad Air with Apple M3 performance, Liquid Retina display, and USB-C connectivity for productivity and creative work.",
        category: "Computers & Laptops",
        price: 59999,
        attributes: {
            brand: "Apple",
            model: "iPad Air 11-inch M3",
            processor: "Apple M3",
            ramGB: 8,
            storageGB: 128,
            display: "11-inch Liquid Retina",
            operatingSystem: "iPadOS",
            usbPort: "USB-C",
            applePencilSupport: true,
        },
    },
    {
        productName: "Apple iPad Pro 11-inch M4",
        description:
            "Professional iPad powered by Apple's M4 chip with an advanced Ultra Retina XDR display and USB-C Thunderbolt connectivity.",
        category: "Computers & Laptops",
        price: 99999,
        attributes: {
            brand: "Apple",
            model: "iPad Pro 11-inch M4",
            processor: "Apple M4",
            ramGB: 8,
            storageGB: 256,
            display: "11-inch Ultra Retina XDR OLED",
            operatingSystem: "iPadOS",
            usbPort: "USB-C Thunderbolt",
            applePencilSupport: true,
        },
    },
    {
        productName: "Samsung Galaxy Tab S10+",
        description:
            "Premium Android tablet with AMOLED display, S Pen support, powerful performance, and a large screen for productivity and entertainment.",
        category: "Computers & Laptops",
        price: 99999,
        attributes: {
            brand: "Samsung",
            model: "Galaxy Tab S10+",
            ramGB: 12,
            storageGB: 256,
            display: "12.4-inch Dynamic AMOLED 2X",
            operatingSystem: "Android",
            sPenSupport: true,
            refreshRateHz: 120,
        },
    },

    // ============================================================
    // MONITORS
    // ============================================================

    {
        productName: "Dell UltraSharp U2723QE 27-inch 4K Monitor",
        description:
            "Professional 27-inch 4K IPS monitor designed for productivity, development, content creation, and color-sensitive workflows.",
        category: "Computers & Laptops",
        price: 54999,
        attributes: {
            brand: "Dell",
            model: "U2723QE",
            screenSizeInches: 27,
            resolution: "3840x2160",
            panel: "IPS Black",
            refreshRateHz: 60,
            usbCHub: true,
            usbPowerDeliveryWatts: 90,
        },
    },
    {
        productName: "LG UltraGear 27GP850 27-inch Gaming Monitor",
        description:
            "27-inch gaming monitor with QHD resolution, high refresh rate, fast response time, and adaptive sync support.",
        category: "Computers & Laptops",
        price: 34999,
        attributes: {
            brand: "LG",
            model: "27GP850",
            screenSizeInches: 27,
            resolution: "2560x1440",
            panel: "Nano IPS",
            refreshRateHz: 165,
            responseTimeMs: 1,
            adaptiveSync: true,
        },
    },
    {
        productName: "Samsung Odyssey G5 27-inch",
        description:
            "Curved QHD gaming monitor with a high refresh rate designed for immersive gaming and entertainment.",
        category: "Computers & Laptops",
        price: 27999,
        attributes: {
            brand: "Samsung",
            model: "Odyssey G5",
            screenSizeInches: 27,
            resolution: "2560x1440",
            panel: "VA",
            refreshRateHz: 165,
            curved: true,
            adaptiveSync: true,
        },
    },
    {
        productName: "BenQ PD2705U 27-inch 4K Monitor",
        description:
            "Professional 4K monitor designed for designers, developers, photographers, and content creators.",
        category: "Computers & Laptops",
        price: 44999,
        attributes: {
            brand: "BenQ",
            model: "PD2705U",
            screenSizeInches: 27,
            resolution: "3840x2160",
            panel: "IPS",
            refreshRateHz: 60,
            usbCHub: true,
            factoryCalibrated: true,
        },
    },
    {
        productName: "LG UltraWide 34-inch Monitor",
        description:
            "Ultrawide monitor providing an expansive workspace for multitasking, development, productivity, and media consumption.",
        category: "Computers & Laptops",
        price: 44999,
        attributes: {
            brand: "LG",
            screenSizeInches: 34,
            resolution: "3440x1440",
            panel: "IPS",
            refreshRateHz: 100,
            ultrawide: true,
            usbCHub: true,
        },
    },

    // ============================================================
    // USB / PENDRIVE / STORAGE
    // ============================================================

    {
        productName: "SanDisk Ultra Flair 64GB USB 3.0 Pen Drive",
        description:
            "Compact metal USB flash drive suitable for transferring documents, photos, videos, and other everyday files.",
        category: "Electronics",
        price: 599,
        attributes: {
            brand: "SanDisk",
            model: "Ultra Flair",
            storageGB: 64,
            interface: "USB 3.0",
            connector: "USB-A",
            metalBody: true,
        },
    },
    {
        productName: "SanDisk Ultra Flair 128GB USB 3.0 Pen Drive",
        description:
            "High-capacity USB 3.0 flash drive with a durable metal body for everyday file storage and transfer.",
        category: "Electronics",
        price: 899,
        attributes: {
            brand: "SanDisk",
            model: "Ultra Flair",
            storageGB: 128,
            interface: "USB 3.0",
            connector: "USB-A",
            metalBody: true,
        },
    },
    {
        productName: "SanDisk Ultra Dual Drive Go 128GB",
        description:
            "Dual-connector flash drive with USB-C and USB-A connectors for convenient file transfers between phones, tablets, and computers.",
        category: "Electronics",
        price: 1199,
        attributes: {
            brand: "SanDisk",
            model: "Ultra Dual Drive Go",
            storageGB: 128,
            connectors: "USB-C + USB-A",
            interface: "USB 3.2",
            dualConnector: true,
        },
    },
    {
        productName: "Samsung BAR Plus 128GB USB 3.1",
        description:
            "Durable metal USB flash drive designed for reliable everyday storage and fast file transfers.",
        category: "Electronics",
        price: 999,
        attributes: {
            brand: "Samsung",
            model: "BAR Plus",
            storageGB: 128,
            interface: "USB 3.1",
            connector: "USB-A",
            waterproof: true,
            metalBody: true,
        },
    },
    {
        productName: "Kingston DataTraveler Exodia 128GB",
        description:
            "Affordable USB flash drive for storing and transferring documents, media, and everyday files.",
        category: "Electronics",
        price: 749,
        attributes: {
            brand: "Kingston",
            model: "DataTraveler Exodia",
            storageGB: 128,
            interface: "USB 3.2 Gen 1",
            connector: "USB-A",
        },
    },
    {
        productName: "Samsung T7 Portable SSD 1TB",
        description:
            "Compact portable SSD offering fast external storage for laptops, desktops, tablets, and compatible smartphones.",
        category: "Electronics",
        price: 9999,
        attributes: {
            brand: "Samsung",
            model: "T7",
            storageGB: 1024,
            interface: "USB 3.2 Gen 2",
            connector: "USB-C",
            readSpeedMBps: 1050,
            portable: true,
        },
    },
    {
        productName: "Samsung T7 Shield Portable SSD 1TB",
        description:
            "Rugged portable SSD designed for fast file transfers with additional protection for mobile and outdoor workflows.",
        category: "Electronics",
        price: 10999,
        attributes: {
            brand: "Samsung",
            model: "T7 Shield",
            storageGB: 1024,
            interface: "USB 3.2 Gen 2",
            connector: "USB-C",
            readSpeedMBps: 1050,
            rugged: true,
            waterResistant: true,
        },
    },
    {
        productName: "SanDisk Extreme Portable SSD 1TB",
        description:
            "Portable high-speed SSD designed for photographers, developers, creators, and users who need fast external storage.",
        category: "Electronics",
        price: 9499,
        attributes: {
            brand: "SanDisk",
            model: "Extreme Portable SSD",
            storageGB: 1024,
            interface: "USB 3.2 Gen 2",
            connector: "USB-C",
            readSpeedMBps: 1050,
            portable: true,
        },
    },

    // ============================================================
    // USB-C HUBS / ADAPTERS
    // ============================================================

    {
        productName: "Anker 7-in-1 USB-C Hub",
        description:
            "Multi-port USB-C hub providing HDMI, USB-A, USB-C, SD card, and microSD connectivity for modern laptops and tablets.",
        category: "Electronics",
        price: 4499,
        attributes: {
            brand: "Anker",
            ports: 7,
            usbA: 2,
            usbC: 1,
            hdmi: true,
            sdCard: true,
            microSD: true,
            powerDelivery: true,
        },
    },
    {
        productName: "UGREEN 6-in-1 USB-C Hub",
        description:
            "Compact multi-port USB-C adapter designed to expand connectivity on MacBooks, laptops, tablets, and other USB-C devices.",
        category: "Electronics",
        price: 2999,
        attributes: {
            brand: "UGREEN",
            ports: 6,
            usbA: 3,
            usbC: 1,
            hdmi: true,
            sdCard: true,
            powerDelivery: true,
        },
    },
    {
        productName: "Belkin 7-in-1 USB-C Hub",
        description:
            "Premium USB-C hub offering multiple USB ports, HDMI output, SD card connectivity, and USB-C power delivery.",
        category: "Electronics",
        price: 4999,
        attributes: {
            brand: "Belkin",
            ports: 7,
            usbA: 2,
            usbC: 1,
            hdmi: true,
            sdCard: true,
            powerDelivery: true,
        },
    },
    {
        productName: "Apple USB-C Digital AV Multiport Adapter",
        description:
            "Apple USB-C adapter providing HDMI output, USB connectivity, and USB-C charging support for compatible Mac and iPad devices.",
        category: "Electronics",
        price: 6999,
        attributes: {
            brand: "Apple",
            ports: 3,
            usbA: 1,
            hdmi: true,
            usbCCharging: true,
            officialAccessory: true,
        },
    },
    {
        productName: "TP-Link USB-C to Ethernet Adapter",
        description:
            "Compact USB-C network adapter providing wired Gigabit Ethernet connectivity for laptops and tablets.",
        category: "Electronics",
        price: 1499,
        attributes: {
            brand: "TP-Link",
            connector: "USB-C",
            ethernet: "Gigabit Ethernet",
            plugAndPlay: true,
        },
    },

    // ============================================================
    // CHARGERS / CABLES
    // ============================================================

    {
        productName: "Apple 20W USB-C Power Adapter",
        description:
            "Compact Apple USB-C power adapter suitable for charging iPhone, iPad, AirPods, and other compatible USB-C devices.",
        category: "Electronics",
        price: 1899,
        attributes: {
            brand: "Apple",
            powerWatts: 20,
            port: "USB-C",
            usbPD: true,
        },
    },
    {
        productName: "Anker 65W GaN Charger",
        description:
            "Compact GaN fast charger capable of powering smartphones, tablets, laptops, and other USB-C devices.",
        category: "Electronics",
        price: 3999,
        attributes: {
            brand: "Anker",
            powerWatts: 65,
            technology: "GaN",
            ports: 3,
            usbC: 2,
            usbA: 1,
            usbPD: true,
        },
    },
    {
        productName: "UGREEN 100W GaN Charger",
        description:
            "High-power GaN charger designed to simultaneously charge laptops, tablets, smartphones, and accessories.",
        category: "Electronics",
        price: 4999,
        attributes: {
            brand: "UGREEN",
            powerWatts: 100,
            technology: "GaN",
            ports: 4,
            usbC: 3,
            usbA: 1,
            usbPD: true,
        },
    },
    {
        productName: "Apple USB-C Charge Cable 1m",
        description:
            "USB-C charging and data cable designed for compatible Apple devices and other USB-C hardware.",
        category: "Electronics",
        price: 1900,
        attributes: {
            brand: "Apple",
            lengthMeters: 1,
            connector: "USB-C to USB-C",
            dataTransfer: true,
            charging: true,
        },
    },
    {
        productName: "Anker USB-C to USB-C Cable 100W",
        description:
            "Durable USB-C cable supporting high-power charging and high-speed data transfer for compatible devices.",
        category: "Electronics",
        price: 999,
        attributes: {
            brand: "Anker",
            powerWatts: 100,
            connector: "USB-C to USB-C",
            lengthMeters: 1.8,
            usbPD: true,
        },
    },

    // ============================================================
    // POWER BANKS
    // ============================================================

    {
        productName: "Anker PowerCore 20000mAh Power Bank",
        description:
            "High-capacity portable power bank designed for charging smartphones, tablets, and other USB devices while traveling.",
        category: "Electronics",
        price: 2499,
        attributes: {
            brand: "Anker",
            capacityMah: 20000,
            usbPorts: 2,
            usbC: true,
            fastCharging: true,
        },
    },
    {
        productName: "MI Power Bank 20000mAh",
        description:
            "High-capacity portable battery pack with USB connectivity for charging smartphones, tablets, and accessories.",
        category: "Electronics",
        price: 1799,
        attributes: {
            brand: "Xiaomi",
            capacityMah: 20000,
            usbPorts: 2,
            usbC: true,
            fastCharging: true,
        },
    },

    // ============================================================
    // SMARTWATCHES
    // ============================================================

    {
        productName: "Apple Watch Series 10",
        description:
            "Apple smartwatch with a large display, health and fitness tracking, notifications, and seamless integration with iPhone.",
        category: "Electronics",
        price: 46999,
        attributes: {
            brand: "Apple",
            model: "Apple Watch Series 10",
            display: "LTPO OLED",
            gps: true,
            heartRateMonitor: true,
            ecg: true,
            waterResistance: true,
            cellular: false,
        },
    },
    {
        productName: "Apple Watch Ultra 2",
        description:
            "Rugged Apple smartwatch designed for outdoor activities, fitness tracking, navigation, and demanding everyday use.",
        category: "Electronics",
        price: 89999,
        attributes: {
            brand: "Apple",
            model: "Apple Watch Ultra 2",
            display: "LTPO OLED",
            gps: true,
            heartRateMonitor: true,
            ecg: true,
            waterResistance: true,
            titaniumCase: true,
            cellular: true,
        },
    },
    {
        productName: "Samsung Galaxy Watch7",
        description:
            "Samsung smartwatch with AMOLED display, health monitoring, fitness tracking, GPS, and Android ecosystem integration.",
        category: "Electronics",
        price: 29999,
        attributes: {
            brand: "Samsung",
            model: "Galaxy Watch7",
            display: "Super AMOLED",
            gps: true,
            heartRateMonitor: true,
            sleepTracking: true,
            waterResistance: true,
        },
    },
    {
        productName: "Garmin Forerunner 265",
        description:
            "GPS running smartwatch with AMOLED display, advanced training metrics, heart-rate monitoring, and multisport tracking.",
        category: "Electronics",
        price: 44999,
        attributes: {
            brand: "Garmin",
            model: "Forerunner 265",
            display: "AMOLED",
            gps: true,
            heartRateMonitor: true,
            runningMetrics: true,
            multisport: true,
        },
    },

    // ============================================================
    // AUDIO
    // ============================================================

    {
        productName: "Apple AirPods Pro 2nd Generation",
        description:
            "Premium wireless earbuds with active noise cancellation, transparency mode, spatial audio, and USB-C charging.",
        category: "Electronics",
        price: 24999,
        attributes: {
            brand: "Apple",
            model: "AirPods Pro 2",
            activeNoiseCancellation: true,
            transparencyMode: true,
            spatialAudio: true,
            chargingPort: "USB-C",
            wireless: true,
        },
    },
    {
        productName: "Sony WH-1000XM5",
        description:
            "Premium wireless over-ear headphones with advanced active noise cancellation, high-quality audio, and long battery life.",
        category: "Electronics",
        price: 29999,
        attributes: {
            brand: "Sony",
            model: "WH-1000XM5",
            activeNoiseCancellation: true,
            microphone: true,
            wireless: true,
            batteryLifeHours: 30,
            bluetooth: true,
        },
    },
    {
        productName: "JBL Charge 5",
        description:
            "Portable Bluetooth speaker with powerful sound, long battery life, and water-resistant construction for outdoor use.",
        category: "Electronics",
        price: 12999,
        attributes: {
            brand: "JBL",
            model: "Charge 5",
            bluetooth: true,
            batteryLifeHours: 20,
            waterproof: true,
            powerBank: true,
        },
    },

    // ============================================================
    // KEYBOARD / MOUSE / WEBCAM
    // ============================================================

    {
        productName: "Logitech MX Keys S",
        description:
            "Premium wireless keyboard designed for productivity with comfortable low-profile keys and multi-device support.",
        category: "Electronics",
        price: 10999,
        attributes: {
            brand: "Logitech",
            model: "MX Keys S",
            wireless: true,
            bluetooth: true,
            backlit: true,
            multiDevice: true,
            rechargeable: true,
        },
    },
    {
        productName: "Logitech MX Master 3S",
        description:
            "Premium wireless productivity mouse with high-precision tracking, quiet clicks, and multi-device connectivity.",
        category: "Electronics",
        price: 9999,
        attributes: {
            brand: "Logitech",
            model: "MX Master 3S",
            wireless: true,
            bluetooth: true,
            dpi: 8000,
            buttons: 7,
            rechargeable: true,
            multiDevice: true,
        },
    },
    {
        productName: "Logitech C920 HD Pro Webcam",
        description:
            "Full HD webcam designed for video calls, online meetings, streaming, and remote work.",
        category: "Electronics",
        price: 6999,
        attributes: {
            brand: "Logitech",
            model: "C920",
            resolution: "1080p",
            microphone: true,
            autofocus: true,
            usb: true,
        },
    },
];

async function seedProducts() {
    console.log("🌱 Starting realistic electronics product seeding...");

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
    console.log(`📦 Product catalog contains ${productData.length} products.`);

    const rows = productData.map((product, index) => {
        const merchant = merchantList[index % merchantList.length];

        const stockQty = 20 + ((index * 17) % 131);

        return {
            productName: product.productName,
            description: product.description,
            merchantId: merchant.id,
            category: product.category,
            price: product.price.toFixed(2),
            currency: "INR",

            attributes: {
                ...product.attributes,
                sku: `ELEC - ${String(index + 1).padStart(4, "0")} `,
            },

            inventoryStock: stockQty,
            availableStock: stockQty,
            reserveStock: 0,
            soldStock: 0,
        };
    });

    const BATCH_SIZE = 50;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        await db.insert(products).values(batch);

        console.log(
            `✅ Inserted ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`,
        );
    }

    console.log("🎉 Realistic electronics product seeding completed.");
}

seedProducts()
    .then(() => {
        console.log("Successfully seeded realistic electronics products.");
    })
    .catch((error) => {
        console.error("❌ Product seeding failed:", error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
