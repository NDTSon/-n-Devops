package com.blog.blogservice.controller;

import com.blog.blogservice.client.FileServiceClient;
import com.blog.blogservice.dto.BlogRequest;
import com.blog.blogservice.dto.BlogResponse;
import com.blog.blogservice.dto.FileUploadResponse;
import com.blog.blogservice.service.BlogService;
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
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final FileServiceClient fileServiceClient;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "accessLevel", defaultValue = "PUBLIC") String accessLevel,
            @RequestParam(value = "description", required = false) String description,
            HttpServletRequest httpRequest) {
        try {
            // Get JWT token from header
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication required"));
            }
            
            // Upload to file-service
            FileUploadResponse uploadResponse = fileServiceClient.uploadFile(
                    file, 
                    authHeader, 
                    accessLevel, 
                    description
            );
            
            // Return response with fileId and download URL
            Map<String, Object> response = new HashMap<>();
            response.put("fileId", uploadResponse.getFileId());
            response.put("url", uploadResponse.getDownloadUrl());
            response.put("originalFileName", uploadResponse.getOriginalFileName());
            response.put("fileSize", uploadResponse.getFileSize());
            response.put("contentType", uploadResponse.getContentType());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not upload file: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<BlogResponse>> getAllBlogs(
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive,
            HttpServletRequest httpRequest) {

        if (includeInactive) {
            String role = (String) httpRequest.getAttribute("role");
            if ("ADMIN".equals(role)) {
                return ResponseEntity.ok(blogService.getAllBlogs());
            } else if ("EDITOR".equals(role)) {
                UUID userId = (UUID) httpRequest.getAttribute("userId");
                return ResponseEntity.ok(blogService.getBlogsByAuthor(userId));
            }
        }

        return ResponseEntity.ok(blogService.getPublicBlogs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBlogById(@PathVariable UUID id) {
        try {
            BlogResponse blog = blogService.getBlogById(id);
            return ResponseEntity.ok(blog);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createBlog(@Valid @RequestBody BlogRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = (UUID) httpRequest.getAttribute("userId");
            String authorUsername = (String) httpRequest.getAttribute("username");
            String role = (String) httpRequest.getAttribute("role");

            if (authorId == null || authorUsername == null || role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            BlogResponse blog = blogService.createBlog(request, authorId, authorUsername, role);
            return ResponseEntity.status(HttpStatus.CREATED).body(blog);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBlog(@PathVariable UUID id,
            @Valid @RequestBody BlogRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = (UUID) httpRequest.getAttribute("userId");
            String role = (String) httpRequest.getAttribute("role");

            if (authorId == null || role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            BlogResponse blog = blogService.updateBlog(id, request, authorId, role);
            return ResponseEntity.ok(blog);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBlog(@PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");

            if (role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            UUID userId = (UUID) httpRequest.getAttribute("userId");
            blogService.deleteBlog(id, userId, role);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Blog deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @GetMapping("/pinned")
    public ResponseEntity<List<BlogResponse>> getPinnedBlogs() {
        return ResponseEntity.ok(blogService.getPinnedBlogs());
    }

    @PutMapping("/{id}/pin")
    public ResponseEntity<?> pinBlog(@PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");

            if (role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            BlogResponse blog = blogService.pinBlog(id, role);
            return ResponseEntity.ok(blog);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @PutMapping("/{id}/unpin")
    public ResponseEntity<?> unpinBlog(@PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            String role = (String) httpRequest.getAttribute("role");

            if (role == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            BlogResponse blog = blogService.unpinBlog(id, role);
            return ResponseEntity.ok(blog);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }
}
