package com.blog.userservice.controller;

import com.blog.userservice.dto.ChangePasswordRequest;
import com.blog.userservice.dto.UpdateRoleRequest;
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
     * Get all users (Admin only)
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");

            // Check if user is admin
            if (!"ADMIN".equals(role)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only administrators can view all users");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            List<UserResponse> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Update user role (Admin only)
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");
            UUID currentUserId = (UUID) httpRequest.getAttribute("userId");

            // Check if user is admin
            if (!"ADMIN".equals(role)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only administrators can update user roles");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // Prevent admin from changing their own role
            if (id.equals(currentUserId)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "You cannot change your own role");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            UserResponse updatedUser = userService.updateUserRole(id, request.getRole());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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
}
