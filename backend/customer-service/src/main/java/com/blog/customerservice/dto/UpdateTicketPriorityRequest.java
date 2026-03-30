package com.blog.customerservice.dto;

import com.blog.customerservice.model.SupportTicket;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTicketPriorityRequest {

    @NotNull(message = "Priority is required")
    private SupportTicket.TicketPriority priority;
}
