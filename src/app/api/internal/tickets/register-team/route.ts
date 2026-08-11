import { NextRequest, NextResponse } from "next/server";
import { requireInternalApiKey } from "@/lib/internal-api-auth";
import crypto from "crypto";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  external_team_id: z.string().uuid(),
  external_championship_id: z.string().uuid(),
  team_name: z.string().min(1),
  players: z.array(
    z.object({
      name: z.string().min(1),
      phone: z.string().nullable().optional()
    })
  ).length(2, "A equipe deve ter exatamente 2 jogadores.")
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = req.headers.get("X-Request-ID") || crypto.randomUUID();
  const logData: Record<string, unknown> = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    endpoint: '/api/internal/tickets/register-team',
    status_code: 500,
    success: false,
    duration_ms: 0
  };

  try {
    // 1. Authenticate
    try {
      await requireInternalApiKey();
    } catch {
      logData.status_code = 401;
      logData.error_code = 'UNAUTHORIZED';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));

      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", request_id: requestId },
        { status: 401 }
      );
    }

    // 2. Parse Payload
    let rawPayload;
    try {
      rawPayload = await req.json();
    } catch {
      logData.status_code = 422;
      logData.error_code = 'INVALID_JSON';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));

      return NextResponse.json({
        success: false,
        code: 'INVALID_JSON',
        message: 'Payload JSON inválido.',
        request_id: requestId
      }, { status: 422 });
    }

    const parseResult = payloadSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      logData.status_code = 400;
      logData.error_code = 'INVALID_PAYLOAD';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));

      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        message: 'Payload não está de acordo com o contrato.',
        errors: parseResult.error.format(),
        request_id: requestId
      }, { status: 400 });
    }

    const payload = parseResult.data;
    const sourceSystem = 'A2TICKETS360';
    
    logData.external_team_id = payload.external_team_id;
    logData.external_championship_id = payload.external_championship_id;

    // 3. Execute Idempotent RPC
    const { data: rpcData, error: rpcError } = await adminClient.rpc('register_external_team_with_players', {
      p_championship_id: payload.external_championship_id,
      p_team_name: payload.team_name,
      p_source_system: sourceSystem,
      p_external_team_id: payload.external_team_id,
      p_players: payload.players
    });

    if (rpcError) {
      if (rpcError.message === 'Campeonato não encontrado.') {
        logData.status_code = 404;
        logData.error_code = 'CHAMPIONSHIP_NOT_FOUND';
        logData.duration_ms = Date.now() - startTime;
        console.log(JSON.stringify(logData));

        return NextResponse.json({
          success: false,
          code: 'CHAMPIONSHIP_NOT_FOUND',
          message: rpcError.message,
          request_id: requestId
        }, { status: 404 });
      }

      logData.status_code = 500;
      logData.error_code = 'RPC_ERROR';
      logData.error_message = rpcError.message;
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));

      return NextResponse.json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao processar inscrição.',
        request_id: requestId
      }, { status: 500 });
    }

    // 4. Handle Success
    const result = rpcData as { success: boolean; created: boolean; team_id: string };
    const statusCode = result.created ? 201 : 200;

    logData.status_code = statusCode;
    logData.success = true;
    logData.created = result.created;
    logData.team_id = result.team_id;
    logData.duration_ms = Date.now() - startTime;
    console.log(JSON.stringify(logData));

    return NextResponse.json({
      success: true,
      created: result.created,
      team_id: result.team_id,
      request_id: requestId
    }, { status: statusCode });

  } catch (error) {
    logData.status_code = 500;
    logData.error_code = 'UNHANDLED_EXCEPTION';
    logData.error_message = error instanceof Error ? error.message : 'Unknown error';
    logData.duration_ms = Date.now() - startTime;
    console.log(JSON.stringify(logData));

    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor.", request_id: requestId },
      { status: 500 }
    );
  }
}
