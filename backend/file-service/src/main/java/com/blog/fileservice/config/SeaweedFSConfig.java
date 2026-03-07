package com.blog.fileservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class SeaweedFSConfig {
    
    @Value("${seaweedfs.master.url}")
    private String masterUrl;
    
    @Value("${seaweedfs.filer.url}")
    private String filerUrl;
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    public String getMasterUrl() {
        return masterUrl;
    }
    
    public String getFilerUrl() {
        return filerUrl;
    }
}
