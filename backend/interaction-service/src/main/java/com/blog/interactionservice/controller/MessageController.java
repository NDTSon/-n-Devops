package com.blog.interactionservice.controller;

import com.blog.interactionservice.dto.ConversationResponse;
import com.blog.interactionservice.dto.MessageRequest;
import com.blog.interactionservice.dto.MessageResponse;
import com.blog.interactionservice.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/{receiverId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable UUID receiverId,
            @Valid @RequestBody MessageRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID senderId = (UUID) httpRequest.getAttribute("userId");
            if (senderId == null) return unauthorized();
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(messageService.sendMessage(senderId, receiverId, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getMessages(
            @PathVariable UUID userId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = (UUID) httpRequest.getAttribute("userId");
            if (currentUserId == null) return unauthorized();
            return ResponseEntity.ok(messageService.getMessagesBetweenUsers(currentUserId, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            if (userId == null) return unauthorized();
            return ResponseEntity.ok(messageService.getConversations(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID messageId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            if (userId == null) return unauthorized();
            messageService.markAsRead(messageId, userId);
            return ResponseEntity.ok(Map.of("message", "Message marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/read-all/{senderId}")
    public ResponseEntity<?> markAllAsReadFromSender(
            @PathVariable UUID senderId,
            HttpServletRequest httpRequest) {
        try {
            UUID receiverId = (UUID) httpRequest.getAttribute("userId");
            if (receiverId == null) return unauthorized();
            messageService.markAllAsReadFromSender(receiverId, senderId);
            return ResponseEntity.ok(Map.of("message", "All messages marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest httpRequest) {
        UUID userId = (UUID) httpRequest.getAttribute("userId");
        if (userId == null) return unauthorized();
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(userId)));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
    }
}
