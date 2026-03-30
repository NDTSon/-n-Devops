package com.blog.customerservice.repository;

import com.blog.customerservice.model.AiModelUsageDaily;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AiModelUsageDailyRepository extends JpaRepository<AiModelUsageDaily, Long> {

    Optional<AiModelUsageDaily> findByModelNameAndUsageDate(String modelName, LocalDate usageDate);

    List<AiModelUsageDaily> findByUsageDate(LocalDate usageDate);

    List<AiModelUsageDaily> findByUsageDateBetween(LocalDate fromDate, LocalDate toDate);
}
