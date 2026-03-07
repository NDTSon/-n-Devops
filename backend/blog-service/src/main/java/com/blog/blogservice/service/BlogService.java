package com.blog.blogservice.service;

import com.blog.blogservice.dto.BlogRequest;
import com.blog.blogservice.dto.BlogResponse;
import com.blog.blogservice.model.Blog;
import com.blog.blogservice.repository.BlogRepository;
import com.blog.blogservice.security.Permission;
import com.blog.blogservice.security.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;
    private final PermissionService permissionService;

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

        Blog blog = Blog.builder()
                .code(request.getCode())
                .name(request.getName())
                .title(request.getTitle())
                .content(request.getContent())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .imageFileId(request.getImageFileId())
                .imageMimeType(request.getImageMimeType())
                .originalFileName(request.getOriginalFileName())
                .status(request.getStatus() != null ? request.getStatus() : true)
                .authorId(authorId)
                .authorUsername(authorUsername)
                .build();

        Blog savedBlog = blogRepository.save(blog);
        return mapToResponse(savedBlog);
    }

    public BlogResponse updateBlog(UUID id, BlogRequest request, UUID authorId, String role) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));

        // Check permission with ownership logic
        if (!permissionService.canAccess(role, Permission.BLOG_UPDATE_OWN, authorId, blog.getAuthorId())) {
            throw new RuntimeException("You do not have permission to update this blog post");
        }

        blog.setCode(request.getCode());
        blog.setName(request.getName());
        blog.setTitle(request.getTitle());
        blog.setContent(request.getContent());
        blog.setDescription(request.getDescription());
        blog.setImageUrl(request.getImageUrl());
        blog.setImageFileId(request.getImageFileId());
        blog.setImageMimeType(request.getImageMimeType());
        blog.setOriginalFileName(request.getOriginalFileName());
        blog.setStatus(request.getStatus() != null ? request.getStatus() : true);

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
        return BlogResponse.builder()
                .id(blog.getId())
                .code(blog.getCode())
                .name(blog.getName())
                .title(blog.getTitle())
                .content(blog.getContent())
                .description(blog.getDescription())
                .imageUrl(blog.getImageUrl())
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
}
