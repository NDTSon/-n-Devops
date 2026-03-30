package com.blog.customerservice.dto;

import com.blog.customerservice.model.SupportTicket;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTicketStatusRequest {

    @NotNull(message = "Status is required")
    private SupportTicket.TicketStatus status;
}

