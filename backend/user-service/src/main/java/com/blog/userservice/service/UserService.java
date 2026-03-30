package com.blog.userservice.service;

import com.blog.userservice.dto.UserResponse;
import com.blog.userservice.model.User;
import com.blog.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Get all users
     */
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get user by ID
     */
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    /**
     * Update user role (Admin only)
     * 
     * @param userId  User ID to update
    * @param newRole New role (USER, EDITOR, SUPPORT, ADMIN)
     * @return Updated user
     */
    public UserResponse updateUserRole(UUID userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate role
        try {
            User.Role role = User.Role.valueOf(newRole.toUpperCase());
            user.setRole(role);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + newRole + ". Must be USER, EDITOR, SUPPORT, or ADMIN");
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    /**
     * Update user role with actor-aware permission rules.
     * ADMIN: can update any non-self account.
     * SUPPORT: can only manage USER/EDITOR and only assign USER/EDITOR.
     */
    public UserResponse updateUserRoleByActor(UUID actorId, String actorRole, UUID targetUserId, String newRole) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String normalizedActorRole = actorRole == null ? "" : actorRole.toUpperCase();
        String normalizedNewRole = newRole == null ? "" : newRole.toUpperCase();

        if (!"ADMIN".equals(normalizedActorRole) && !"SUPPORT".equals(normalizedActorRole)) {
            throw new RuntimeException("Only administrators or support staff can update user roles");
        }

        if (targetUserId.equals(actorId)) {
            throw new RuntimeException("You cannot change your own role");
        }

        if ("SUPPORT".equals(normalizedActorRole)) {
            User.Role targetCurrentRole = targetUser.getRole();
            if (targetCurrentRole == User.Role.ADMIN || targetCurrentRole == User.Role.SUPPORT) {
                throw new RuntimeException("Support can only manage USER or EDITOR accounts");
            }

            if (!"USER".equals(normalizedNewRole) && !"EDITOR".equals(normalizedNewRole)) {
                throw new RuntimeException("Support can only assign USER or EDITOR roles");
            }
        }

        return updateUserRole(targetUserId, normalizedNewRole);
    }

    /**
     * Change user password
     * 
     * @param userId          User ID
     * @param currentPassword Current password for verification
     * @param newPassword     New password to set
     */
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password is different
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send email notification
        emailService.sendPasswordChangeNotification(user.getEmail(), user.getUsername());
    }

    /**
     * Force update password by privileged staff (ADMIN/SUPPORT).
     */
    public void updateUserPasswordByActor(UUID actorId, String actorRole, UUID targetUserId, String newPassword) {
        String normalizedActorRole = actorRole == null ? "" : actorRole.toUpperCase();

        if (!"ADMIN".equals(normalizedActorRole) && !"SUPPORT".equals(normalizedActorRole)) {
            throw new RuntimeException("Only administrators or support staff can update user passwords");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int actorLevel = getRoleLevel(normalizedActorRole);
        int targetLevel = getRoleLevel(targetUser.getRole().name());
        if (actorLevel <= targetLevel) {
            throw new RuntimeException("You can only update passwords for lower-role accounts");
        }

        if (passwordEncoder.matches(newPassword, targetUser.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        targetUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(targetUser);

        emailService.sendPasswordChangeNotification(targetUser.getEmail(), targetUser.getUsername());
    }

    private int getRoleLevel(String role) {
        return switch (role) {
            case "ADMIN" -> 4;
            case "SUPPORT" -> 3;
            case "EDITOR" -> 2;
            case "USER" -> 1;
            default -> 0;
        };
    }

    /**
     * Get raw User entity (for internal use)
     */
    public User getRawUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Update showEmail preference for the authenticated user
     */
    public UserResponse updateShowEmail(UUID userId, boolean showEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setShowEmail(showEmail);
        User saved = userRepository.save(user);
        return mapToResponseFull(saved);
    }

    // Returns full data including email (for own profile / admin)
    public UserResponse mapToResponseFull(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.getEnabled())
                .showEmail(user.getShowEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserResponse mapToResponse(User user) {
        // For public view – hide email if user opted out
        String email = Boolean.TRUE.equals(user.getShowEmail()) ? user.getEmail() : null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(email)
                .role(user.getRole().name())
                .enabled(user.getEnabled())
                .showEmail(user.getShowEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
