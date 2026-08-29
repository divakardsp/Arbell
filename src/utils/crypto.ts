import crypto from "crypto";
import { ApiError } from "./ApiError";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM

/**
 * Derives a 32-byte encryption key from environment secrets.
 */
function getEncryptionKey(): Buffer {
    const rawKey =
        process.env.TOKEN_ENCRYPTION_KEY ||
        process.env.RAZORPAY_API_SECRET ||
        process.env.RAZORPAY_KEY_SECRET;

    if (!rawKey) {
        throw ApiError.internal(
            "Missing encryption key (TOKEN_ENCRYPTION_KEY or RAZORPAY_API_SECRET) in environment."
        );
    }

    // Hash to ensure a uniform 256-bit (32 bytes) key
    return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts a sensitive string (such as a Razorpay token) using AES-256-GCM.
 * Output format: `iv_hex:authTag_hex:ciphertext_hex`
 */
export function encryptToken(plaintext: string): string {
    if (!plaintext || typeof plaintext !== "string") {
        throw ApiError.badRequest("Cannot encrypt empty token.");
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted token string.
 * Returns the plaintext token only in memory.
 */
export function decryptToken(encryptedData: string): string {
    if (!encryptedData || typeof encryptedData !== "string") {
        throw ApiError.badRequest("Cannot decrypt empty token data.");
    }

    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
        throw ApiError.internal("Invalid encrypted token format.");
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    try {
        let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        throw ApiError.internal("Failed to decrypt token. Authentication tag verification failed.");
    }
}
