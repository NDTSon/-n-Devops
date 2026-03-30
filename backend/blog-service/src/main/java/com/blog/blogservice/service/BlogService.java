package com.blog.blogservice.service;

import com.blog.blogservice.client.NotificationServiceClient;
import com.blog.blogservice.client.UserServiceClient;
import com.blog.blogservice.dto.BlogRequest;
import com.blog.blogservice.dto.BlogResponse;
import com.blog.blogservice.model.Blog;
import com.blog.blogservice.model.Category;
import com.blog.blogservice.repository.BlogRepository;
import com.blog.blogservice.repository.CategoryRepository;
import com.blog.blogservice.security.Permission;
import com.blog.blogservice.security.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogService {

    private static final Pattern FILE_DOWNLOAD_PATTERN = Pattern.compile(".*/api/files/download/(\\d+)$");

    private final BlogRepository blogRepository;
    private final CategoryRepository categoryRepository;
    private final PermissionService permissionService;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    public List<BlogResponse> getAllBlogs() {
        return blogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BlogResponse> getPublicBlogs() {
        return blogRepository.findAllByStatusTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BlogResponse> getPinnedBlogs() {
        return blogRepository.findAllByStatusTrueAndPinnedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BlogResponse> getBlogsByAuthor(UUID authorId) {
        return blogRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BlogResponse> searchBlogs(String query, boolean includeInactive) {
        // Remove @ prefix if searching for username
        String keyword = query.startsWith("@") ? query.substring(1) : query;
        
        if (includeInactive) {
            return blogRepository.searchBlogs(keyword)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else {
            return blogRepository.searchPublicBlogs(keyword)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    public List<BlogResponse> getFollowingFeed(String userId) {
        try {
            // Get list of following user IDs from user-service (internal call: pass userId directly)
            List<UUID> followingIds = userServiceClient.getFollowingIds(userId);
            
            if (followingIds == null || followingIds.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Get public blogs from followed users
            return blogRepository.findAllByStatusTrueOrderByCreatedAtDesc()
                    .stream()
                    .filter(blog -> followingIds.contains(blog.getAuthorId()))
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // If error calling user-service, return empty list
            System.err.println("Error fetching following feed: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public BlogResponse getBlogById(UUID id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
        return mapToResponse(blog);
    }

    public BlogResponse createBlog(BlogRequest request, UUID authorId, String authorUsername, String role) {
        // Check permission
        if (!permissionService.hasPermission(role, Permission.BLOG_CREATE)) {
            throw new RuntimeException("You do not have permission to create blog posts");
        }

        // Validate category exists and is active
        validateCategory(request.getCategoryId());

        Blog blog = Blog.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .title(request.getTitle())
                .content(request.getContent())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
            .imageFileId(resolveImageFileId(request.getImageFileId(), request.getImageUrl()))
                .imageMimeType(request.getImageMimeType())
                .originalFileName(request.getOriginalFileName())
                .status(request.getStatus() != null ? request.getStatus() : true)
                .authorId(authorId)
                .authorUsername(authorUsername)
                .build();

        Blog savedBlog = blogRepository.save(blog);
        
        // Notify followers about new post
        try {
            List<UUID> followerIds = userServiceClient.getFollowerIds(authorId);
            if (followerIds != null && !followerIds.isEmpty()) {
                notificationServiceClient.notifyNewPost(Map.of(
                    "followerIds", followerIds.stream().map(UUID::toString).toList(),
                    "authorId", authorId.toString(),
                    "authorUsername", authorUsername,
                    "blogId", savedBlog.getId().toString(),
                    "blogTitle", savedBlog.getTitle()
                ));
            }
        } catch (Exception e) {
            System.err.println("Failed to send new post notifications: " + e.getMessage());
        }

        return mapToResponse(savedBlog);
    }

    public BlogResponse updateBlog(UUID id, BlogRequest request, UUID authorId, String role) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));

        // Check permission with ownership logic
        if (!permissionService.canAccess(role, Permission.BLOG_UPDATE_OWN, authorId, blog.getAuthorId())) {
            throw new RuntimeException("You do not have permission to update this blog post");
        }

        // Validate category exists and is active
        validateCategory(request.getCategoryId());

        blog.setCategoryId(request.getCategoryId());
        blog.setName(request.getName());
        blog.setTitle(request.getTitle());
        blog.setContent(request.getContent());
        blog.setDescription(request.getDescription());
        blog.setImageUrl(request.getImageUrl());
        blog.setImageFileId(resolveImageFileId(request.getImageFileId(), request.getImageUrl()));
        blog.setImageMimeType(request.getImageMimeType());
        blog.setOriginalFileName(request.getOriginalFileName());
        blog.setStatus(request.getStatus() != null ? request.getStatus() : true);
        
        // Notify user if updated by admin (actor is not author)
        if (!authorId.equals(blog.getAuthorId())) {
            try {
                notificationServiceClient.notifyPostEdited(Map.of(
                    "userId", blog.getAuthorId().toString(),
                    "adminUsername", "Admin", 
                    "blogId", blog.getId().toString(),
                    "blogTitle", blog.getTitle()
                ));
            } catch (Exception e) {
                System.err.println("Failed to send post edited notification: " + e.getMessage());
            }
        }

        Blog updatedBlog = blogRepository.save(blog);
        return mapToResponse(updatedBlog);
    }

    public void deleteBlog(UUID id, UUID userId, String role) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));

        // Check permission with ownership logic
        if (!permissionService.canAccess(role, Permission.BLOG_DELETE_OWN, userId, blog.getAuthorId())) {
            throw new RuntimeException("You do not have permission to delete this blog post");
        }

        // Notify user if deleted by admin
        if (!userId.equals(blog.getAuthorId())) {
            try {
                notificationServiceClient.notifyPostDeleted(Map.of(
                    "userId", blog.getAuthorId().toString(),
                    "adminUsername", "Admin",
                    "blogTitle", blog.getTitle()
                ));
            } catch (Exception e) {
                System.err.println("Failed to send post deleted notification: " + e.getMessage());
            }
        }

        blogRepository.delete(blog);
    }

    public BlogResponse pinBlog(UUID id, String role) {
        // Check if user is admin
        if (!"ADMIN".equals(role)) {
            throw new RuntimeException("Only administrators can pin blog posts");
        }

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
        
        blog.setPinned(true);
        Blog updatedBlog = blogRepository.save(blog);
        
        // Notify post pinned
        try {
            notificationServiceClient.notifyPostPinned(Map.of(
                "blogId", updatedBlog.getId().toString(),
                "blogTitle", updatedBlog.getTitle(),
                "adminUsername", "Admin"
            ));
        } catch (Exception e) {
            System.err.println("Failed to send post pinned notification: " + e.getMessage());
        }
        
        return mapToResponse(updatedBlog);
    }

    public BlogResponse unpinBlog(UUID id, String role) {
        // Check if user is admin
        if (!"ADMIN".equals(role)) {
            throw new RuntimeException("Only administrators can unpin blog posts");
        }

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
        
        blog.setPinned(false);
        Blog updatedBlog = blogRepository.save(blog);
        return mapToResponse(updatedBlog);
    }

    private BlogResponse mapToResponse(Blog blog) {
        // Get category name
        String categoryName = categoryRepository.findById(blog.getCategoryId())
                .map(Category::getName)
                .orElse(null);

        String resolvedImageUrl = blog.getImageUrl();
        if ((resolvedImageUrl == null || resolvedImageUrl.isBlank()) && blog.getImageFileId() != null) {
            resolvedImageUrl = "/api/files/download/" + blog.getImageFileId();
        }

        return BlogResponse.builder()
                .id(blog.getId())
                .categoryId(blog.getCategoryId())
                .categoryName(categoryName)
                .name(blog.getName())
                .title(blog.getTitle())
                .content(blog.getContent())
                .description(blog.getDescription())
            .imageUrl(resolvedImageUrl)
                .imageFileId(blog.getImageFileId())
                .imageMimeType(blog.getImageMimeType())
                .originalFileName(blog.getOriginalFileName())
                .status(blog.getStatus())
                .pinned(blog.getPinned())
                .authorId(blog.getAuthorId())
                .authorUsername(blog.getAuthorUsername())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .build();
    }

    private Long resolveImageFileId(Long imageFileId, String imageUrl) {
        if (imageFileId != null) {
            return imageFileId;
        }

        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        Matcher matcher = FILE_DOWNLOAD_PATTERN.matcher(imageUrl);
        if (matcher.matches()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }

    private void validateCategory(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        if (!category.getActive()) {
            throw new RuntimeException("Cannot use inactive category");
        }
    }
}
