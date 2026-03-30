package com.blog.interactionservice.service;

import com.blog.interactionservice.dto.CommentRequest;
import com.blog.interactionservice.dto.CommentResponse;
import com.blog.interactionservice.model.Comment;
import com.blog.interactionservice.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    public List<CommentResponse> getAllCommentsByBlogId(UUID blogId) {
        List<Comment> parentComments = commentRepository.findByBlogIdAndParentIdIsNullOrderByCreatedAtDesc(blogId);
        return parentComments.stream()
                .map(this::mapToResponseWithReplies)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponseWithReplies(Comment comment) {
        CommentResponse response = mapToResponse(comment);
        List<CommentResponse> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        response.setReplies(replies);
        return response;
    }

    public CommentResponse createComment(CommentRequest request, UUID authorId, String authorUsername,
                                         UUID blogAuthorId, String blogTitle) {
        UUID blogId = request.getBlogId();

        // Validate parent exists if provided
        if (request.getParentId() != null) {
            commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        }

        Comment comment = Comment.builder()
                .content(request.getContent())
                .blogId(blogId)
                .authorId(authorId)
                .authorUsername(authorUsername)
                .parentId(request.getParentId())
                .build();

        Comment savedComment = commentRepository.save(comment);

        // Gửi notifications - vì cùng service, gọi trực tiếp
        try {
            if (request.getParentId() != null) {
                Comment parent = commentRepository.findById(request.getParentId()).orElse(null);
                if (parent != null && !parent.getAuthorId().equals(authorId)) {
                    notificationService.createCommentReplyNotification(
                            parent.getAuthorId(), authorId, authorUsername,
                            savedComment.getId(), blogId);
                }
            } else {
                // Notify blog author (blogAuthorId truyền vào từ controller qua header)
                if (blogAuthorId != null && !blogAuthorId.equals(authorId)) {
                    notificationService.createCommentOnPostNotification(
                            blogAuthorId, authorId, authorUsername, blogId, blogTitle);
                }
            }
        } catch (Exception e) {
            // Không fail toàn bộ request vì notification
            System.err.println("Failed to send comment notification: " + e.getMessage());
        }

        return mapToResponse(savedComment);
    }

    public CommentResponse updateComment(UUID id, CommentRequest request, UUID userId, String role) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean isOwner = comment.getAuthorId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role);

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You do not have permission to update this comment");
        }

        comment.setContent(request.getContent());
        return mapToResponse(commentRepository.save(comment));
    }

    public void deleteComment(UUID id, UUID userId, String role) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean isOwner = comment.getAuthorId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role);

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You do not have permission to delete this comment");
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
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
