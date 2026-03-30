package com.blog.customerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAiModelRequest {

    @NotBlank(message = "Model is required")
    private String model;
}
