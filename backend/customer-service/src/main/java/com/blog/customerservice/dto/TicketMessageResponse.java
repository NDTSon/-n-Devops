package com.blog.customerservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TicketMessageResponse {
    private UUID id;
    private UUID ticketId;
    private UUID senderId;
    private String senderUsername;
    private String senderRole;
    private String message;
    private LocalDateTime createdAt;
}

