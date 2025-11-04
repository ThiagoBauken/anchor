-- Performance indexes for better query optimization

-- Indexes for User table
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_active_idx" ON "User"("active");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_created_at_idx" ON "User"("created_at");

-- Indexes for Project table
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX "Project_createdByUserId_idx" ON "Project"("createdByUserId");
CREATE INDEX "Project_deleted_idx" ON "Project"("deleted");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- Indexes for Location table
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- Indexes for anchor_points table
CREATE INDEX "anchor_points_project_id_idx" ON "anchor_points"("project_id");
CREATE INDEX "anchor_points_status_idx" ON "anchor_points"("status");
CREATE INDEX "anchor_points_archived_idx" ON "anchor_points"("archived");
CREATE INDEX "anchor_points_created_by_user_id_idx" ON "anchor_points"("created_by_user_id");
CREATE INDEX "anchor_points_data_hora_idx" ON "anchor_points"("data_hora");
CREATE INDEX "anchor_points_numero_ponto_idx" ON "anchor_points"("numero_ponto");

-- Composite indexes for common queries
CREATE INDEX "anchor_points_project_status_idx" ON "anchor_points"("project_id", "status");
CREATE INDEX "anchor_points_project_archived_idx" ON "anchor_points"("project_id", "archived");

-- Indexes for anchor_tests table
CREATE INDEX "anchor_tests_ponto_id_idx" ON "anchor_tests"("ponto_id");
CREATE INDEX "anchor_tests_data_hora_idx" ON "anchor_tests"("data_hora");
CREATE INDEX "anchor_tests_resultado_idx" ON "anchor_tests"("resultado");
CREATE INDEX "anchor_tests_tecnico_idx" ON "anchor_tests"("tecnico");

-- Composite indexes for anchor_tests
CREATE INDEX "anchor_tests_ponto_data_idx" ON "anchor_tests"("ponto_id", "data_hora" DESC);

-- Indexes for files table
CREATE INDEX "files_company_id_idx" ON "files"("company_id");
CREATE INDEX "files_user_id_idx" ON "files"("user_id");
CREATE INDEX "files_uploaded_idx" ON "files"("uploaded");
CREATE INDEX "files_created_at_idx" ON "files"("created_at");

-- Indexes for sync_queue table
CREATE INDEX "sync_queue_company_id_idx" ON "sync_queue"("company_id");
CREATE INDEX "sync_queue_user_id_idx" ON "sync_queue"("user_id");
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");
CREATE INDEX "sync_queue_created_at_idx" ON "sync_queue"("created_at");
CREATE INDEX "sync_queue_operation_idx" ON "sync_queue"("operation");
CREATE INDEX "sync_queue_table_name_idx" ON "sync_queue"("table_name");

-- Composite indexes for sync_queue
CREATE INDEX "sync_queue_status_created_idx" ON "sync_queue"("status", "created_at");
CREATE INDEX "sync_queue_company_status_idx" ON "sync_queue"("company_id", "status");

-- Indexes for user_sessions table
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");
CREATE INDEX "user_sessions_created_at_idx" ON "user_sessions"("created_at");

-- Text search indexes for better searching
CREATE INDEX "anchor_points_localizacao_gin_idx" ON "anchor_points" USING gin(to_tsvector('portuguese', "localizacao"));
CREATE INDEX "anchor_points_observacoes_gin_idx" ON "anchor_points" USING gin(to_tsvector('portuguese', "observacoes"));
CREATE INDEX "anchor_tests_observacoes_gin_idx" ON "anchor_tests" USING gin(to_tsvector('portuguese', "observacoes"));

-- Partial indexes for common filtered queries
CREATE INDEX "anchor_points_active_idx" ON "anchor_points"("project_id") WHERE "archived" = false;
CREATE INDEX "sync_queue_pending_idx" ON "sync_queue"("created_at") WHERE "status" = 'pending';
CREATE INDEX "User_active_users_idx" ON "User"("companyId") WHERE "active" = true;
CREATE INDEX "Project_active_projects_idx" ON "Project"("companyId") WHERE "deleted" = false;