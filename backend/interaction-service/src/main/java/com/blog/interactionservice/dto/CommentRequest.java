package com.blog.interactionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CommentRequest {
    @NotNull(message = "Blog ID is required")
    private UUID blogId;

    @NotBlank(message = "Content is required")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String content;

    private UUID parentId; // null nếu là comment gốc
}
