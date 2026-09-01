/**
 * Utility mapping tool names to user-friendly human status messages.
 * Easily extensible as new MCP tools are added to the agent catalog.
 */

const TOOL_MESSAGE_MAP: Record<string, string> = {
    search_products: "Searching products...",
    get_product_detail: "Getting product details...",
    compare_products: "Comparing product options...",
    check_inventory: "Checking stock and availability...",
    check_payment_authorization: "Checking payment authorization...",
    initiate_buy_now: "Initiating order purchase...",
    confirm_mandate_payment: "Verifying payment mandate...",
    get_user_orders: "Retrieving order history...",
    get_order_details: "Fetching order details...",
};

export function getToolDisplayMessage(toolName: string): string {
    if (TOOL_MESSAGE_MAP[toolName]) {
        return TOOL_MESSAGE_MAP[toolName];
    }

    // Default formatted fallback: 'some_custom_tool' -> 'Executing some custom tool...'
    const cleanName = toolName.replace(/_/g, " ");
    return `Executing ${cleanName}...`;
}
