package com.blog.blogservice.service;

import com.blog.blogservice.dto.CommentRequest;
import com.blog.blogservice.dto.CommentResponse;
import com.blog.blogservice.model.Comment;
import com.blog.blogservice.repository.CommentRepository;
import com.blog.blogservice.security.Permission;
import com.blog.blogservice.security.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PermissionService permissionService;

    public List<CommentResponse> getAllCommentsByBlogId(UUID blogId) {
        return commentRepository.findByBlogIdOrderByCreatedAtDesc(blogId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse createComment(UUID blogId, CommentRequest request, UUID authorId, String authorUsername) {
        Comment comment = Comment.builder()
                .content(request.getContent())
                .blogId(blogId)
                .authorId(authorId)
                .authorUsername(authorUsername)
                .build();

        Comment savedComment = commentRepository.save(comment);
        return mapToResponse(savedComment);
    }

    public CommentResponse updateComment(UUID id, CommentRequest request, UUID userId, String role) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Check permission with ownership logic
        if (!permissionService.canAccess(role, Permission.COMMENT_UPDATE_OWN, userId, comment.getAuthorId())) {
            throw new RuntimeException("You do not have permission to update this comment");
        }

        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);
        return mapToResponse(updatedComment);
    }

    public void deleteComment(UUID id, UUID userId, String role) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Check permission - only ADMIN can delete comments
        if (!permissionService.hasPermission(role, Permission.COMMENT_DELETE_ALL)) {
            throw new RuntimeException("You do not have permission to delete comments");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .blogId(comment.getBlogId())
                .authorId(comment.getAuthorId())
                .authorUsername(comment.getAuthorUsername())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
