package com.blog.customerservice.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiUsageSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrateSchema() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS ai_model_usage_daily (
                        id BIGSERIAL PRIMARY KEY,
                        model_name VARCHAR(100) NOT NULL,
                        usage_date DATE NOT NULL,
                        request_count BIGINT NOT NULL DEFAULT 0,
                        prompt_tokens BIGINT NOT NULL DEFAULT 0,
                        completion_tokens BIGINT NOT NULL DEFAULT 0,
                        total_tokens BIGINT NOT NULL DEFAULT 0,
                        peak_rpm INTEGER NOT NULL DEFAULT 0,
                        peak_tpm BIGINT NOT NULL DEFAULT 0,
                        CONSTRAINT uk_ai_model_usage_daily_model_date UNIQUE (model_name, usage_date)
                    )
                    """);

            jdbcTemplate.execute("ALTER TABLE ai_model_usage_daily ADD COLUMN IF NOT EXISTS peak_rpm INTEGER NOT NULL DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE ai_model_usage_daily ADD COLUMN IF NOT EXISTS peak_tpm BIGINT NOT NULL DEFAULT 0");
        } catch (Exception e) {
            log.error("Failed to initialize ai_model_usage_daily schema", e);
        }
    }
}
