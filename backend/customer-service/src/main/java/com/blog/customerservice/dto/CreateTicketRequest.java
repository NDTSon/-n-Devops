package com.blog.customerservice.dto;

import com.blog.customerservice.model.SupportTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotBlank(message = "Subject is required")
    @Size(max = 255, message = "Subject must be at most 255 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(max = 4000, message = "Description must be at most 4000 characters")
    private String description;

    private SupportTicket.TicketPriority priority = SupportTicket.TicketPriority.NORMAL;
}

