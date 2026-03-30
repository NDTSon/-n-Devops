package com.blog.interactionservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String type;
    private String content;
    private UUID relatedId;
    private UUID actorId;
    private String actorUsername;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
