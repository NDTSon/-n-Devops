package com.blog.blogservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogResponse {
    private UUID id;
    private String code;
    private String name;
    private String title;
    private String content;
    private String description;
    private String imageUrl;
    private Long imageFileId;
    private String imageMimeType;
    private String originalFileName;
    private Boolean status;
    private Boolean pinned;
    private UUID authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
