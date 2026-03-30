package com.blog.userservice.controller;

import com.blog.userservice.dto.ChangePasswordRequest;
import com.blog.userservice.dto.UpdateRoleRequest;
import com.blog.userservice.dto.UpdateUserPasswordRequest;
import com.blog.userservice.dto.UserResponse;
import com.blog.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get all users - public endpoint for user discovery
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpServletRequest httpRequest) {
        try {
            // Public: return all users for discovery
            List<UserResponse> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get user profile by ID - public endpoint
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
        * Update user role (Admin and Support with restrictions)
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");
            UUID currentUserId = (UUID) httpRequest.getAttribute("userId");

            if (currentUserId == null || role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "User not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            UserResponse updatedUser = userService.updateUserRoleByActor(currentUserId, role, id, request.getRole());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    /**
     * Update password for a user by privileged role (Admin/Support)
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateUserPassword(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserPasswordRequest request,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");
            UUID currentUserId = (UUID) httpRequest.getAttribute("userId");

            if (currentUserId == null || role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "User not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            userService.updateUserPasswordByActor(currentUserId, role, id, request.getNewPassword());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password updated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Change password (Authenticated users)
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");

            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "User not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to change password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get own profile (authenticated) - returns full data including hidden email
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(userService.mapToResponseFull(userService.getRawUser(userId)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update showEmail setting for authenticated user
     */
    @PutMapping("/me/show-email")
    public ResponseEntity<?> updateShowEmail(
            @RequestBody Map<String, Boolean> body,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            Boolean showEmail = body.getOrDefault("showEmail", false);
            UserResponse updated = userService.updateShowEmail(userId, showEmail);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}
