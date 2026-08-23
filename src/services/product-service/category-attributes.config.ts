import { SQL, sql } from "drizzle-orm";
import { products } from "@/db/schema";

export type AttributeType = "string" | "number" | "boolean";

export interface AttributeConfig {
    type: AttributeType;
}

/**
 * Category-to-searchable-attributes configuration map derived from product catalog definitions.
 */
export const CATEGORY_ATTRIBUTES_CONFIG: Record<
    string,
    Record<string, AttributeConfig>
> = {
    Electronics: {
        sku: { type: "string" },
        brand: { type: "string" },
        connectivity: { type: "string" },
        batteryLifeHours: { type: "number" },
        noiseCancellation: { type: "boolean" },
        microphone: { type: "boolean" },
        bluetoothVersion: { type: "string" },
        waterproof: { type: "boolean" },
        wattOutput: { type: "number" },
        screenSizeInches: { type: "number" },
        resolution: { type: "string" },
        refreshRateHz: { type: "number" },
        smartTV: { type: "boolean" },
        displayType: { type: "string" },
        waterResistance: { type: "string" },
        batteryDays: { type: "number" },
        heartRateMonitor: { type: "boolean" },
        capacityMah: { type: "number" },
        fastCharging: { type: "boolean" },
        usbPorts: { type: "number" },
        pdSupport: { type: "boolean" },
    },
    Clothing: {
        sku: { type: "string" },
        material: { type: "string" },
        fit: { type: "string" },
        size: { type: "string" },
        washable: { type: "boolean" },
        sleeve: { type: "string" },
        machineWash: { type: "boolean" },
        hooded: { type: "boolean" },
        waistSize: { type: "number" },
        stretch: { type: "boolean" },
        neck: { type: "string" },
    },
    Footwear: {
        sku: { type: "string" },
        material: { type: "string" },
        size: { type: "number" },
        sole: { type: "string" },
        lightweight: { type: "boolean" },
        upper: { type: "string" },
        closure: { type: "string" },
        unisex: { type: "boolean" },
        formal: { type: "boolean" },
        adjustableStraps: { type: "boolean" },
        waterResistant: { type: "boolean" },
        washable: { type: "boolean" },
    },
    Books: {
        sku: { type: "string" },
        author: { type: "string" },
        format: { type: "string" },
        pages: { type: "number" },
        language: { type: "string" },
    },
    "Home & Kitchen": {
        sku: { type: "string" },
        pieces: { type: "number" },
        material: { type: "string" },
        inductionCompatible: { type: "boolean" },
        dishwasherSafe: { type: "boolean" },
        capacityMl: { type: "number" },
        insulated: { type: "boolean" },
        leakProof: { type: "boolean" },
        airtight: { type: "boolean" },
        microwaveSafe: { type: "boolean" },
        capacityLitres: { type: "number" },
        powerWatts: { type: "number" },
        autoShutOff: { type: "boolean" },
        jars: { type: "number" },
        speedLevels: { type: "number" },
        overloadProtection: { type: "boolean" },
    },
    Furniture: {
        sku: { type: "string" },
        material: { type: "string" },
        widthCm: { type: "number" },
        storageDrawers: { type: "number" },
        assemblyRequired: { type: "boolean" },
        adjustableHeight: { type: "boolean" },
        lumbarSupport: { type: "boolean" },
        weightCapacityKg: { type: "number" },
        seats: { type: "number" },
        frameMaterial: { type: "string" },
        drawers: { type: "number" },
        shelves: { type: "number" },
        heightCm: { type: "number" },
    },
    "Beauty & Personal Care": {
        sku: { type: "string" },
        volumeMl: { type: "number" },
        vitaminCPercent: { type: "number" },
        skinType: { type: "string" },
        parabenFree: { type: "boolean" },
        volumeGrams: { type: "number" },
        fragranceFree: { type: "boolean" },
        nonComedogenic: { type: "boolean" },
        hairType: { type: "string" },
        sulfateFree: { type: "boolean" },
        suitableForDailyUse: { type: "boolean" },
        batteryLifeMinutes: { type: "number" },
        waterproof: { type: "boolean" },
        charging: { type: "string" },
        adjustableLength: { type: "boolean" },
        powerWatts: { type: "number" },
        heatSettings: { type: "number" },
        speedSettings: { type: "number" },
        coolShot: { type: "boolean" },
    },
    Grocery: {
        sku: { type: "string" },
        weightKg: { type: "number" },
        grainType: { type: "string" },
        aged: { type: "boolean" },
        vegetarian: { type: "boolean" },
        volumeLitres: { type: "number" },
        oilType: { type: "string" },
        coldPressed: { type: "boolean" },
        organic: { type: "boolean" },
        wholeGrain: { type: "boolean" },
        teaBags: { type: "number" },
        flavour: { type: "string" },
        caffeine: { type: "boolean" },
        weightGrams: { type: "number" },
        contents: { type: "string" },
        roasted: { type: "boolean" },
    },
    "Sports & Fitness": {
        sku: { type: "string" },
        weightKg: { type: "number" },
        adjustable: { type: "boolean" },
        material: { type: "string" },
        pieces: { type: "number" },
        thicknessMm: { type: "number" },
        nonSlip: { type: "boolean" },
        lengthCm: { type: "number" },
        size: { type: "string" },
        grip: { type: "string" },
        bladder: { type: "string" },
        machineStitched: { type: "boolean" },
        bands: { type: "number" },
        resistanceKg: { type: "number" },
        latexFree: { type: "boolean" },
        portable: { type: "boolean" },
    },
    "Toys & Games": {
        sku: { type: "string" },
        pieces: { type: "number" },
        recommendedAge: { type: "string" },
        material: { type: "string" },
        educational: { type: "boolean" },
        scale: { type: "string" },
        rechargeable: { type: "boolean" },
        remoteRangeMeters: { type: "number" },
        players: { type: "string" },
        playTimeMinutes: { type: "number" },
        heightCm: { type: "number" },
        washable: { type: "boolean" },
    },
    "Jewelry & Accessories": {
        sku: { type: "string" },
        caseMaterial: { type: "string" },
        strap: { type: "string" },
        waterResistance: { type: "string" },
        movement: { type: "string" },
        material: { type: "string" },
        chainLengthCm: { type: "number" },
        hypoallergenic: { type: "boolean" },
        plated: { type: "boolean" },
        adjustable: { type: "boolean" },
        unisex: { type: "boolean" },
        handmade: { type: "boolean" },
        frameMaterial: { type: "string" },
        uvProtection: { type: "string" },
        polarized: { type: "boolean" },
        lensColor: { type: "string" },
        plating: { type: "string" },
        pair: { type: "boolean" },
    },
    "Bags & Luggage": {
        sku: { type: "string" },
        capacityLitres: { type: "number" },
        laptopSizeInches: { type: "number" },
        waterResistant: { type: "boolean" },
        usbPort: { type: "boolean" },
        material: { type: "string" },
        wheels: { type: "number" },
        tsaLock: { type: "boolean" },
        shoulderStrap: { type: "boolean" },
        cardSlots: { type: "number" },
        cashCompartment: { type: "boolean" },
        rfidProtection: { type: "boolean" },
        adjustableStrap: { type: "boolean" },
    },
    Automotive: {
        sku: { type: "string" },
        resolution: { type: "string" },
        nightVision: { type: "boolean" },
        loopRecording: { type: "boolean" },
        wifi: { type: "boolean" },
        powerWatts: { type: "number" },
        cordless: { type: "boolean" },
        batteryMinutes: { type: "number" },
        attachments: { type: "number" },
        mounting: { type: "string" },
        rotationDegrees: { type: "number" },
        oneHandOperation: { type: "boolean" },
        compatibleWithMostPhones: { type: "boolean" },
        maxPressurePsi: { type: "number" },
        digitalDisplay: { type: "boolean" },
        autoStop: { type: "boolean" },
        powerSource: { type: "string" },
        pieces: { type: "number" },
        microfiberCloths: { type: "number" },
        brushes: { type: "number" },
        reusable: { type: "boolean" },
    },
    "Mobile Phones": {
        sku: { type: "string" },
        brand: { type: "string" },
        ramGB: { type: "number" },
        storageGB: { type: "number" },
        batteryMah: { type: "number" },
        fiveG: { type: "boolean" },
        display: { type: "string" },
        wirelessCharging: { type: "boolean" },
        material: { type: "string" },
        shockProtection: { type: "boolean" },
        wirelessChargingCompatible: { type: "boolean" },
        transparent: { type: "boolean" },
        powerWatts: { type: "number" },
        port: { type: "string" },
        pdSupport: { type: "boolean" },
        galliumNitride: { type: "boolean" },
    },
    "Computers & Laptops": {
        sku: { type: "string" },
        brand: { type: "string" },
        ramGB: { type: "number" },
        storageGB: { type: "number" },
        storageType: { type: "string" },
        displayInches: { type: "number" },
        gpu: { type: "string" },
        refreshRateHz: { type: "number" },
        switches: { type: "string" },
        connectivity: { type: "string" },
        backlit: { type: "boolean" },
        wireless: { type: "boolean" },
        dpi: { type: "number" },
        buttons: { type: "number" },
        rechargeable: { type: "boolean" },
        screenSizeInches: { type: "number" },
        resolution: { type: "string" },
        panel: { type: "string" },
    },
    "Cameras & Photography": {
        sku: { type: "string" },
        brand: { type: "string" },
        sensor: { type: "string" },
        videoResolution: { type: "string" },
        interchangeableLens: { type: "boolean" },
        weatherSealed: { type: "boolean" },
        focalLengthMm: { type: "number" },
        aperture: { type: "string" },
        mount: { type: "string" },
        autofocus: { type: "boolean" },
        maxHeightCm: { type: "number" },
        material: { type: "string" },
        loadCapacityKg: { type: "number" },
        quickRelease: { type: "boolean" },
        stabilization: { type: "boolean" },
        waterproofDepthMeters: { type: "number" },
        wifi: { type: "boolean" },
    },
    Appliances: {
        sku: { type: "string" },
        capacityLitres: { type: "number" },
        energyRating: { type: "number" },
        inverterCompressor: { type: "boolean" },
        frostFree: { type: "boolean" },
        capacityKg: { type: "number" },
        rpm: { type: "number" },
        inverterMotor: { type: "boolean" },
        powerWatts: { type: "number" },
        type: { type: "string" },
        digitalDisplay: { type: "boolean" },
        capacityTon: { type: "number" },
        inverter: { type: "boolean" },
        wifi: { type: "boolean" },
        coverageSqFt: { type: "number" },
        filter: { type: "string" },
        airQualitySensor: { type: "boolean" },
    },
    "Health & Wellness": {
        sku: { type: "string" },
        measurement: { type: "string" },
        memoryReadings: { type: "number" },
        irregularHeartbeatDetection: { type: "boolean" },
        batteryPowered: { type: "boolean" },
        maxWeightKg: { type: "number" },
        bluetooth: { type: "boolean" },
        bodyComposition: { type: "boolean" },
        display: { type: "string" },
        speedLevels: { type: "number" },
        attachments: { type: "number" },
        batteryHours: { type: "number" },
        rechargeable: { type: "boolean" },
        lengthCm: { type: "number" },
        material: { type: "string" },
        textured: { type: "boolean" },
        portable: { type: "boolean" },
        powerWatts: { type: "number" },
        heatLevels: { type: "number" },
        autoShutOffMinutes: { type: "number" },
        washableCover: { type: "boolean" },
    },
};

/**
 * Returns the dictionary of allowed searchable attributes for a specific category.
 */
export function getAllowedAttributesForCategory(
    category: string
): Record<string, AttributeConfig> | undefined {
    const matchedCategory = Object.keys(CATEGORY_ATTRIBUTES_CONFIG).find(
        (cat) => cat.toLowerCase() === category.trim().toLowerCase()
    );

    return matchedCategory ? CATEGORY_ATTRIBUTES_CONFIG[matchedCategory] : undefined;
}

/**
 * Dynamically builds SQL conditions for JSONB attributes based on the category configuration.
 *
 * Flow:
 * Category -> Determine allowed attributes -> Build filters dynamically -> Query JSONB attributes
 */
export function buildJsonbAttributeFilters(
    category: string | undefined,
    rawAttributes: Record<string, string>
): SQL[] {
    if (!category) {
        return [];
    }

    const allowedAttributes = getAllowedAttributesForCategory(category);
    if (!allowedAttributes) {
        return [];
    }

    const conditions: SQL[] = [];

    // Case-insensitive lookup helper for raw attributes
    const rawAttrMap = new Map<string, string>();
    for (const [key, val] of Object.entries(rawAttributes)) {
        rawAttrMap.set(key.toLowerCase(), val);
    }

    for (const [attrName, config] of Object.entries(allowedAttributes)) {
        const rawVal = rawAttrMap.get(attrName.toLowerCase());
        if (rawVal === undefined || rawVal.trim() === "") {
            continue;
        }

        const trimmedVal = rawVal.trim();

        if (config.type === "number") {
            const numVal = Number(trimmedVal);
            if (!isNaN(numVal)) {
                conditions.push(
                    sql`CAST(${products.attributes}->>${attrName} AS NUMERIC) = ${numVal}`
                );
            }
        } else if (config.type === "boolean") {
            const lower = trimmedVal.toLowerCase();
            if (lower === "true" || lower === "1") {
                conditions.push(
                    sql`(${products.attributes}->>${attrName})::boolean = true`
                );
            } else if (lower === "false" || lower === "0") {
                conditions.push(
                    sql`(${products.attributes}->>${attrName})::boolean = false`
                );
            }
        } else {
            // String comparison (case-insensitive)
            conditions.push(
                sql`LOWER(${products.attributes}->>${attrName}) = LOWER(${trimmedVal})`
            );
        }
    }

    return conditions;
}
