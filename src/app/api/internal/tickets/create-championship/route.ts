import { NextRequest, NextResponse } from "next/server";
import { requireInternalApiKey } from "@/lib/internal-api-auth";
import { logStructuredInfo } from "@/lib/logger";
import { integrationCreateChampionshipSchema } from "@/domains/integration/integration.validators";
import { IntegrationService } from "@/domains/integration/integration.service";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || crypto.randomUUID();
  const startTime = Date.now();
  let ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  if (!ip) {
    // Next.js 15+ may have it in headers or elsewhere, fallback to null
    ip = null;
  }

  // Pre-fill log params
  const logParams = {
    request_id: requestId,
    endpoint: "/api/internal/tickets/create-championship",
    ip,
    status_code: 500,
    success: false,
    duration_ms: 0,
    source_system: "UNKNOWN",
    external_event_id: "UNKNOWN",
    tenant_external_id: "UNKNOWN",
    error_code: "",
  };

  try {
    // 1. Authenticate
    try {
      await requireInternalApiKey();
    } catch {
      logParams.status_code = 401;
      logParams.error_code = "UNAUTHORIZED";
      logParams.duration_ms = Date.now() - startTime;
      logStructuredInfo(logParams);
      
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", request_id: requestId },
        { status: 401 }
      );
    }

    // 2. Parse Body
    let body;
    try {
      body = await req.json();
    } catch {
      logParams.status_code = 400;
      logParams.error_code = "INVALID_JSON";
      logParams.duration_ms = Date.now() - startTime;
      logStructuredInfo(logParams);

      return NextResponse.json(
        { success: false, code: "INVALID_JSON", message: "Payload inválido.", request_id: requestId },
        { status: 400 }
      );
    }

    // 3. Validate Zod Schema
    const validated = integrationCreateChampionshipSchema.safeParse(body);
    if (!validated.success) {
      logParams.status_code = 400;
      logParams.error_code = "VALIDATION_ERROR";
      logParams.source_system = body?.source_system || "UNKNOWN";
      logParams.duration_ms = Date.now() - startTime;
      logStructuredInfo(logParams);

      return NextResponse.json(
        { 
          success: false, 
          code: "VALIDATION_ERROR", 
          message: "Dados de entrada inválidos.", 
          issues: validated.error.issues,
          request_id: requestId 
        },
        { status: 400 }
      );
    }

    const payload = validated.data;
    logParams.source_system = payload.source_system;
    logParams.external_event_id = payload.external_event_id;
    logParams.tenant_external_id = payload.tenant_external_id;

    // 4. Run Service
    // We use a service role client to bypass RLS and perform mapping.
    // Ensure we do not use createServerClient because we don't want to bind to a session.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase Admin keys not configured.");
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const service = new IntegrationService(supabaseAdmin);
    const { status, data } = await service.createChampionship(payload);

    // 5. Build Response
    data.request_id = requestId;

    logParams.status_code = status;
    logParams.success = data.success;
    logParams.error_code = data.code || "";
    logParams.duration_ms = Date.now() - startTime;
    logStructuredInfo(logParams);

    return NextResponse.json(data, { status });

  } catch (error: unknown) {
    console.error("Unhandled error in create-championship:", error);
    logParams.status_code = 500;
    logParams.error_code = "INTERNAL_ERROR";
    logParams.duration_ms = Date.now() - startTime;
    logStructuredInfo(logParams);

    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor.", request_id: requestId },
      { status: 500 }
    );
  }
}
