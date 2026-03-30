package com.blog.customerservice.repository;

import com.blog.customerservice.model.AiSupportSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiSupportSettingRepository extends JpaRepository<AiSupportSetting, Long> {
    Optional<AiSupportSetting> findBySettingKey(String settingKey);
}
