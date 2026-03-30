package com.blog.interactionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class InteractionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(InteractionServiceApplication.class, args);
    }
}
