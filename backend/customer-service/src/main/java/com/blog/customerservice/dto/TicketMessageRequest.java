package com.blog.customerservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TicketMessageRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 4000, message = "Message must be at most 4000 characters")
    private String message;
}

