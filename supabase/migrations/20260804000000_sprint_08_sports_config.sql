-- Criação da tabela championship_settings
CREATE TABLE IF NOT EXISTS public.championship_settings (
    championship_id UUID PRIMARY KEY REFERENCES public.championships(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sport TEXT NOT NULL,
    format TEXT NOT NULL,
    best_of INTEGER NOT NULL,
    target_score INTEGER NOT NULL,
    draw_allowed BOOLEAN NOT NULL DEFAULT false,
    tie_break_rule TEXT,
    wo_timeout_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.championship_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_championship_settings_all" 
    ON public.championship_settings FOR ALL 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Configuração Esportiva RPC
CREATE OR REPLACE FUNCTION public.configure_championship_sports(
    p_championship_id UUID,
    p_tenant_id UUID,
    p_sport TEXT,
    p_format TEXT,
    p_best_of INTEGER,
    p_target_score INTEGER,
    p_draw_allowed BOOLEAN,
    p_tie_break_rule TEXT,
    p_wo_timeout_minutes INTEGER
) RETURNS JSON AS $$
DECLARE
    v_championship_id UUID;
    v_status TEXT;
BEGIN
    -- Bloqueia o campeonato
    SELECT id, status INTO v_championship_id, v_status
    FROM public.championships
    WHERE id = p_championship_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF v_championship_id IS NULL THEN
        RAISE EXCEPTION 'Campeonato não encontrado ou acesso negado.';
    END IF;

    -- Validações
    IF p_best_of < 1 THEN
        RAISE EXCEPTION 'best_of deve ser no mínimo 1.';
    END IF;
    IF p_target_score < 1 THEN
        RAISE EXCEPTION 'target_score deve ser no mínimo 1.';
    END IF;
    IF p_wo_timeout_minutes < 0 THEN
        RAISE EXCEPTION 'wo_timeout_minutes não pode ser negativo.';
    END IF;

    -- Se for confronto direto
    IF p_format = 'direct_match' THEN
        IF p_sport != 'truco' THEN
            RAISE EXCEPTION 'Formato direct_match suporta apenas truco no momento.';
        END IF;
    END IF;

    -- Inserir ou atualizar settings
    INSERT INTO public.championship_settings (
        championship_id, tenant_id, sport, format, best_of, target_score, draw_allowed, tie_break_rule, wo_timeout_minutes, updated_at
    ) VALUES (
        p_championship_id, p_tenant_id, p_sport, p_format, p_best_of, p_target_score, p_draw_allowed, p_tie_break_rule, p_wo_timeout_minutes, NOW()
    )
    ON CONFLICT (championship_id) DO UPDATE SET
        sport = EXCLUDED.sport,
        format = EXCLUDED.format,
        best_of = EXCLUDED.best_of,
        target_score = EXCLUDED.target_score,
        draw_allowed = EXCLUDED.draw_allowed,
        tie_break_rule = EXCLUDED.tie_break_rule,
        wo_timeout_minutes = EXCLUDED.wo_timeout_minutes,
        updated_at = NOW();

    -- Sincronizar temporariamente as colunas legadas em championships
    UPDATE public.championships
    SET 
        modality = p_sport,
        format = p_format,
        target_score = p_target_score,
        updated_at = NOW()
    WHERE id = p_championship_id;

    RETURN json_build_object(
        'configured', true,
        'championship_id', p_championship_id,
        'sport', p_sport,
        'format', p_format
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
