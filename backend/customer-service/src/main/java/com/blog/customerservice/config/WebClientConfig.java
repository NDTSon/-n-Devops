package com.blog.customerservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient aiWebClient(@Value("${ai.base-url}") String aiBaseUrl) {
        return WebClient.builder()
                .baseUrl(aiBaseUrl)
                .build();
    }
}

