import { NextRequest, NextResponse } from "next/server";
import { requireInternalApiKey } from "@/lib/internal-api-auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || crypto.randomUUID();

  try {
    // 1. Authenticate
    try {
      await requireInternalApiKey();
    } catch {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", request_id: requestId },
        { status: 401 }
      );
    }

    // 2. Return 501 Not Implemented
    return NextResponse.json(
      {
        success: false,
        code: "NOT_IMPLEMENTED",
        message: "Endpoint previsto para uma próxima fatia.",
        request_id: requestId,
      },
      { status: 501 }
    );

  } catch {
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor.", request_id: requestId },
      { status: 500 }
    );
  }
}
