package com.blog.blogservice.controller;

import com.blog.blogservice.dto.CommentRequest;
import com.blog.blogservice.dto.CommentResponse;
import com.blog.blogservice.service.CommentService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/blogs/{blogId}/comments")
    public ResponseEntity<List<CommentResponse>> getCommentsByBlogId(@PathVariable UUID blogId) {
        List<CommentResponse> comments = commentService.getAllCommentsByBlogId(blogId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/blogs/{blogId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable UUID blogId,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {

        try {
            // Get UUID directly - filter already sets it as UUID object
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            String username = (String) httpRequest.getAttribute("username");

            if (userId == null || username == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }

            CommentResponse comment = commentService.createComment(blogId, request, userId, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/comments/{id}")
    public ResponseEntity<?> updateComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {

        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            String role = (String) httpRequest.getAttribute("role");

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }

            CommentResponse comment = commentService.updateComment(id, request, userId, role);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {

        try {
            UUID userId = (UUID) httpRequest.getAttribute("userId");
            String role = (String) httpRequest.getAttribute("role");

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }

            commentService.deleteComment(id, userId, role);
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
