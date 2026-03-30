package com.blog.customerservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class AiAssistRequest {

    private UUID ticketId;

    @NotBlank(message = "Question is required")
    @Size(max = 4000, message = "Question must be at most 4000 characters")
    private String question;
}

