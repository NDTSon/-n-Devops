package com.blog.customerservice.dto;

import com.blog.customerservice.model.SupportTicket;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TicketResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String subject;
    private String description;
    private SupportTicket.TicketStatus status;
    private SupportTicket.TicketPriority priority;
    private UUID assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TicketMessageResponse> messages;
}

