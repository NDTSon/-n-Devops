package com.blog.interactionservice.controller;

import com.blog.interactionservice.dto.NotificationResponse;
import com.blog.interactionservice.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<?> getAllNotifications(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) return unauthorized();
        List<NotificationResponse> notifications = notificationService.getAllNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) return unauthorized();
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) return unauthorized();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id, HttpServletRequest request) {
        if (getUserId(request) == null) return unauthorized();
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) return unauthorized();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/read")
    public ResponseEntity<?> deleteReadNotifications(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) return unauthorized();
        notificationService.deleteReadNotifications(userId);
        return ResponseEntity.ok(Map.of("message", "Read notifications deleted"));
    }

    private UUID getUserId(HttpServletRequest request) {
        return (UUID) request.getAttribute("userId");
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
    }
}
