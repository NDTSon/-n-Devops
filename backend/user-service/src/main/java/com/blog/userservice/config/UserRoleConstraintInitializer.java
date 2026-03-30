package com.blog.userservice.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRoleConstraintInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrateUsersRoleConstraint() {
        try {
            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                              AND table_name = 'users'
                        ) THEN
                            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                            ALTER TABLE users
                                ADD CONSTRAINT users_role_check
                                CHECK (role IN ('USER', 'EDITOR', 'SUPPORT', 'ADMIN'));
                        END IF;
                    END
                    $$;
                    """);
            log.info("users_role_check migrated to include SUPPORT role");
        } catch (Exception e) {
            log.error("Failed to migrate users_role_check constraint", e);
        }
    }
}
