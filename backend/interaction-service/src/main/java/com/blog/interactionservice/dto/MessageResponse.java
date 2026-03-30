package com.blog.interactionservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private UUID senderId;
    private String senderUsername;
    private UUID receiverId;
    private String receiverUsername;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
