import { healthy } from "@/services/health-service/health";
import { NextResponse } from "next/server";

export async function GET(req: Request){
    const response = await healthy();
    return NextResponse.json(response);
}