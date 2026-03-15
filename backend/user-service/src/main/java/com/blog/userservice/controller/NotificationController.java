package com.blog.userservice.controller;

import com.blog.userservice.dto.NotificationResponse;
import com.blog.userservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllNotifications(@RequestHeader("X-User-Id") String userIdStr) {
        try {
            UUID userId = UUID.fromString(userIdStr);
            List<NotificationResponse> notifications = notificationService.getAllNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(@RequestHeader("X-User-Id") String userIdStr) {
        try {
            UUID userId = UUID.fromString(userIdStr);
            List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("X-User-Id") String userIdStr) {
        try {
            UUID userId = UUID.fromString(userIdStr);
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userIdStr) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("X-User-Id") String userIdStr) {
        try {
            UUID userId = UUID.fromString(userIdStr);
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/read")
    public ResponseEntity<?> deleteReadNotifications(@RequestHeader("X-User-Id") String userIdStr) {
        try {
            UUID userId = UUID.fromString(userIdStr);
            notificationService.deleteReadNotifications(userId);
            return ResponseEntity.ok(Map.of("message", "Read notifications deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
