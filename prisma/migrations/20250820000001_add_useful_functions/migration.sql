-- Function to calculate anchor point statistics for a project
CREATE OR REPLACE FUNCTION get_anchor_point_stats(project_id_param TEXT)
RETURNS TABLE(
    total_points INTEGER,
    tested_points INTEGER,
    not_tested_points INTEGER,
    approved_points INTEGER,
    rejected_points INTEGER,
    archived_points INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_points,
        COUNT(*) FILTER (WHERE status != 'Não Testado')::INTEGER as tested_points,
        COUNT(*) FILTER (WHERE status = 'Não Testado')::INTEGER as not_tested_points,
        COUNT(*) FILTER (WHERE status = 'Aprovado')::INTEGER as approved_points,
        COUNT(*) FILTER (WHERE status = 'Reprovado')::INTEGER as rejected_points,
        COUNT(*) FILTER (WHERE archived = true)::INTEGER as archived_points
    FROM anchor_points 
    WHERE project_id = project_id_param;
END;
$$;

-- Function to get anchor points that need inspection (based on frequency)
CREATE OR REPLACE FUNCTION get_anchor_points_needing_inspection(company_id_param TEXT)
RETURNS TABLE(
    id TEXT,
    project_id TEXT,
    numero_ponto TEXT,
    localizacao TEXT,
    last_test_date TIMESTAMP,
    days_since_last_test INTEGER,
    frequencia_inspecao_meses INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.project_id,
        ap.numero_ponto,
        ap.localizacao,
        latest_test.last_test_date,
        CASE 
            WHEN latest_test.last_test_date IS NOT NULL 
            THEN EXTRACT(days FROM (NOW() - latest_test.last_test_date))::INTEGER
            ELSE NULL
        END as days_since_last_test,
        ap.frequencia_inspecao_meses
    FROM anchor_points ap
    INNER JOIN "Project" p ON ap.project_id = p.id
    LEFT JOIN (
        SELECT 
            ponto_id,
            MAX(data_hora) as last_test_date
        FROM anchor_tests
        GROUP BY ponto_id
    ) latest_test ON ap.id = latest_test.ponto_id
    WHERE 
        p."companyId" = company_id_param
        AND ap.archived = false
        AND ap.frequencia_inspecao_meses IS NOT NULL
        AND (
            latest_test.last_test_date IS NULL 
            OR EXTRACT(days FROM (NOW() - latest_test.last_test_date)) >= (ap.frequencia_inspecao_meses * 30)
        )
    ORDER BY 
        CASE 
            WHEN latest_test.last_test_date IS NULL THEN 1
            ELSE 0
        END,
        latest_test.last_test_date ASC;
END;
$$;

-- Function to clean up old sync queue entries
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_queue 
    WHERE 
        status = 'synced' 
        AND synced_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to get company subscription status
CREATE OR REPLACE FUNCTION get_company_subscription_status(company_id_param TEXT)
RETURNS TABLE(
    has_active_subscription BOOLEAN,
    plan_name TEXT,
    status TEXT,
    current_period_end TIMESTAMP,
    max_users INTEGER,
    max_projects INTEGER,
    max_points INTEGER,
    max_storage_gb INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_active_subscription,
        sp.name as plan_name,
        s.status::TEXT,
        s.current_period_end,
        sp.max_users,
        sp.max_projects,
        sp.max_points,
        sp.max_storage_gb
    FROM "Company" c
    LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE c.id = company_id_param;
END;
$$;

-- Function to update anchor point status based on latest test
CREATE OR REPLACE FUNCTION update_anchor_point_status_from_tests()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE anchor_points 
    SET status = latest_test.resultado
    FROM (
        SELECT DISTINCT ON (ponto_id) 
            ponto_id, 
            resultado
        FROM anchor_tests 
        ORDER BY ponto_id, data_hora DESC
    ) latest_test
    WHERE anchor_points.id = latest_test.ponto_id
    AND anchor_points.status != latest_test.resultado;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Trigger to automatically update anchor point status when a new test is added
CREATE OR REPLACE FUNCTION trigger_update_anchor_point_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE anchor_points 
    SET status = NEW.resultado,
        last_modified_by_user_id = COALESCE(NEW.created_by_user_id, last_modified_by_user_id)
    WHERE id = NEW.ponto_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for anchor tests
DROP TRIGGER IF EXISTS update_anchor_point_status_trigger ON anchor_tests;
CREATE TRIGGER update_anchor_point_status_trigger
    AFTER INSERT ON anchor_tests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_anchor_point_status();

-- Function to check company limits
CREATE OR REPLACE FUNCTION check_company_limits(company_id_param TEXT)
RETURNS TABLE(
    current_users INTEGER,
    max_users INTEGER,
    users_within_limit BOOLEAN,
    current_projects INTEGER,
    max_projects INTEGER,
    projects_within_limit BOOLEAN,
    current_points INTEGER,
    max_points INTEGER,
    points_within_limit BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
    subscription_limits RECORD;
BEGIN
    -- Get subscription limits
    SELECT sp.max_users, sp.max_projects, sp.max_points
    INTO subscription_limits
    FROM "Company" c
    LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE c.id = company_id_param;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM "User" WHERE "companyId" = company_id_param AND active = true) as current_users,
        COALESCE(subscription_limits.max_users, 999999) as max_users,
        (SELECT COUNT(*) FROM "User" WHERE "companyId" = company_id_param AND active = true) <= COALESCE(subscription_limits.max_users, 999999) as users_within_limit,
        
        (SELECT COUNT(*)::INTEGER FROM "Project" WHERE "companyId" = company_id_param AND deleted = false) as current_projects,
        COALESCE(subscription_limits.max_projects, 999999) as max_projects,
        (SELECT COUNT(*) FROM "Project" WHERE "companyId" = company_id_param AND deleted = false) <= COALESCE(subscription_limits.max_projects, 999999) as projects_within_limit,
        
        (SELECT COUNT(*)::INTEGER FROM anchor_points ap 
         INNER JOIN "Project" p ON ap.project_id = p.id 
         WHERE p."companyId" = company_id_param AND ap.archived = false) as current_points,
        COALESCE(subscription_limits.max_points, 999999) as max_points,
        (SELECT COUNT(*) FROM anchor_points ap 
         INNER JOIN "Project" p ON ap.project_id = p.id 
         WHERE p."companyId" = company_id_param AND ap.archived = false) <= COALESCE(subscription_limits.max_points, 999999) as points_within_limit;
END;
$$;