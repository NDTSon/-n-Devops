package com.blog.interactionservice.controller;

import com.blog.interactionservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal endpoint - được gọi từ blog-service và user-service.
 * Không cần JWT (được permit trong SecurityConfig).
 */
@RestController
@RequestMapping("/api/internal/notifications")
@RequiredArgsConstructor
public class NotificationInternalController {

    private final NotificationService notificationService;

    @PostMapping("/new-post")
    public ResponseEntity<?> notifyNewPost(@RequestBody Map<String, Object> req) {
        try {
            List<String> followerIdStrs = (List<String>) req.get("followerIds");
            List<UUID> followerIds = followerIdStrs.stream().map(UUID::fromString).toList();
            UUID authorId = UUID.fromString((String) req.get("authorId"));
            String authorUsername = (String) req.get("authorUsername");
            UUID blogId = UUID.fromString((String) req.get("blogId"));
            String blogTitle = (String) req.get("blogTitle");
            notificationService.notifyFollowersAboutNewPost(followerIds, authorId, authorUsername, blogId, blogTitle);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/comment-on-post")
    public ResponseEntity<?> notifyCommentOnPost(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createCommentOnPostNotification(
                    UUID.fromString((String) req.get("userId")),
                    UUID.fromString((String) req.get("actorId")),
                    (String) req.get("actorUsername"),
                    UUID.fromString((String) req.get("blogId")),
                    (String) req.get("blogTitle")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/comment-reply")
    public ResponseEntity<?> notifyCommentReply(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createCommentReplyNotification(
                    UUID.fromString((String) req.get("userId")),
                    UUID.fromString((String) req.get("actorId")),
                    (String) req.get("actorUsername"),
                    UUID.fromString((String) req.get("commentId")),
                    UUID.fromString((String) req.get("blogId"))
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/post-edited")
    public ResponseEntity<?> notifyPostEdited(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createPostEditedNotification(
                    UUID.fromString((String) req.get("userId")),
                    (String) req.get("adminUsername"),
                    UUID.fromString((String) req.get("blogId")),
                    (String) req.get("blogTitle")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/post-deleted")
    public ResponseEntity<?> notifyPostDeleted(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createPostDeletedNotification(
                    UUID.fromString((String) req.get("userId")),
                    (String) req.get("adminUsername"),
                    (String) req.get("blogTitle")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/post-pinned")
    public ResponseEntity<?> notifyPostPinned(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createPostPinnedNotification(
                    UUID.fromString((String) req.get("recipientId")),
                    UUID.fromString((String) req.get("blogId")),
                    (String) req.get("blogTitle"),
                    (String) req.get("adminUsername")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/new-follower")
    public ResponseEntity<?> notifyNewFollower(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createFollowNotification(
                    UUID.fromString((String) req.get("userId")),
                    UUID.fromString((String) req.get("actorId")),
                    (String) req.get("actorUsername")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/new-message")
    public ResponseEntity<?> notifyNewMessage(@RequestBody Map<String, Object> req) {
        try {
            notificationService.createNewMessageNotification(
                    UUID.fromString((String) req.get("userId")),
                    UUID.fromString((String) req.get("actorId")),
                    (String) req.get("actorUsername")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
