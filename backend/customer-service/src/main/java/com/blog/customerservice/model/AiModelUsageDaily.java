package com.blog.customerservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
        name = "ai_model_usage_daily",
        uniqueConstraints = @UniqueConstraint(columnNames = {"model_name", "usage_date"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelUsageDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private Long requestCount = 0L;

    @Column(name = "prompt_tokens", nullable = false)
    @Builder.Default
    private Long promptTokens = 0L;

    @Column(name = "completion_tokens", nullable = false)
    @Builder.Default
    private Long completionTokens = 0L;

    @Column(name = "total_tokens", nullable = false)
    @Builder.Default
    private Long totalTokens = 0L;

    @Column(name = "peak_rpm", nullable = false)
    @Builder.Default
    private Integer peakRpm = 0;

    @Column(name = "peak_tpm", nullable = false)
    @Builder.Default
    private Long peakTpm = 0L;
}
