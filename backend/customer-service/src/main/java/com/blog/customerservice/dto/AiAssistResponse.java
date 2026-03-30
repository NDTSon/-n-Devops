package com.blog.customerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiAssistResponse {
    private String model;
    private String answer;
}

