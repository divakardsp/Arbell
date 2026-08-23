import { healthy } from "@/services/health-service";
import { NextResponse } from "next/server";

export async function GET() {
    const response = await healthy();
    return NextResponse.json(response);
}