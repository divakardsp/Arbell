import { openai } from "@/lib/openai";
import { DOMAIN_GUARDRAIL_SYSTEM_PROMPT } from "./domain-guardrail.prompt";

export interface DomainGuardrailResult {
    allowed: boolean;
    reason?: string;
}

export const GUARDRAIL_REJECTION_MESSAGE =
    "Arbell is a shopping platform. I can only help with shopping, products, orders, merchants, and other commerce-related requests.";

/**
 * Validates whether the incoming user message matches Arbell's e-commerce domain.
 * Uses OpenAI structured outputs for a deterministic boolean classification.
 *
 * Security Posture: FAIL CLOSED.
 * If the classification API call fails or encounters an exception, allowed returns false.
 */
export async function checkDomainGuardrail(
    userMessage: string,
    model: string = process.env.OPENAI_MODEL || "gpt-5"
): Promise<DomainGuardrailResult> {
    const trimmedMessage = userMessage?.trim();
    if (!trimmedMessage) {
        return {
            allowed: false,
            reason: "Empty or invalid message.",
        };
    }

    try {
        const response = await openai.responses.create({
            model,
            instructions: DOMAIN_GUARDRAIL_SYSTEM_PROMPT,
            input: trimmedMessage,
            text: {
                format: {
                    type: "json_schema",
                    name: "domain_guardrail_decision",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            allowed: {
                                type: "boolean",
                                description: "True if the request is commerce/shopping related, false otherwise.",
                            },
                            reason: {
                                type: "string",
                                description: "Brief internal classification explanation.",
                            },
                        },
                        required: ["allowed", "reason"],
                        additionalProperties: false,
                    },
                },
            },
        });

        const outputText = response.output_text?.trim() || "";
        if (!outputText) {
            console.error("[DomainGuardrail] Empty response from classifier.");
            return {
                allowed: false,
                reason: "Empty response from guardrail classifier.",
            };
        }

        const parsed = JSON.parse(outputText);
        return {
            allowed: Boolean(parsed.allowed),
            reason: parsed.reason || "Domain classification complete.",
        };
    } catch (error: any) {
        // FAIL CLOSED: Any API failure or parsing error rejects the request safely.
        console.error("[DomainGuardrail] Guardrail classification failed (failing closed):", error);
        return {
            allowed: false,
            reason: `Guardrail classification service error: ${error?.message || "Unknown error"}`,
        };
    }
}
