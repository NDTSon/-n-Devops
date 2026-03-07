package com.blog.userservice.config;

import com.blog.userservice.model.User;
import com.blog.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create admin account if it doesn't exist
        if (!userRepository.existsByUsername("sonndt2")) {
            User admin = User.builder()
                    .username("sonndt2")
                    .email("admin@blog.com")
                    .password(passwordEncoder.encode("123456"))
                    .role(User.Role.ADMIN)
                    .enabled(true) // Admin account is pre-verified
                    .build();

            userRepository.save(admin);
            log.info("Admin account created successfully: sonndt2");
        } else {
            log.info("Admin account already exists");
        }
    }
}
