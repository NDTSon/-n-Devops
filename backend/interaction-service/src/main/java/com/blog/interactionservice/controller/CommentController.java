package com.blog.interactionservice.controller;

import com.blog.interactionservice.dto.CommentRequest;
import com.blog.interactionservice.dto.CommentResponse;
import com.blog.interactionservice.service.CommentService;
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
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/blog/{blogId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByBlogId(@PathVariable UUID blogId) {
        return ResponseEntity.ok(commentService.getAllCommentsByBlogId(blogId));
    }

    @PostMapping
    public ResponseEntity<?> createComment(
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId    = (UUID) httpRequest.getAttribute("userId");
            String username = (String) httpRequest.getAttribute("username");

            if (userId == null || username == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }

            // Blog author info được truyền từ blog-service qua header
            String blogAuthorIdStr = httpRequest.getHeader("X-Blog-Author-Id");
            String blogTitle       = httpRequest.getHeader("X-Blog-Title");
            UUID blogAuthorId = null;
            if (blogAuthorIdStr != null && !blogAuthorIdStr.isBlank()) {
                try { blogAuthorId = UUID.fromString(blogAuthorIdStr); } catch (Exception ignored) {}
            }

                CommentResponse comment = commentService.createComment(request, userId, username, blogAuthorId, blogTitle);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

            @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            String role = (String) httpRequest.getAttribute("role");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));

            return ResponseEntity.ok(commentService.updateComment(id, request, userId, role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            String role = (String) httpRequest.getAttribute("role");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));

            commentService.deleteComment(id, userId, role);
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
