package com.watchden.user.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Disabled: Using UserProfileController for direct file serving to ensure
        // robustness
        // String currentDir = System.getProperty("user.dir");
        // String uploadPath = Paths.get(currentDir, "uploads").toUri().toString();

        // if (!uploadPath.endsWith("/")) {
        // uploadPath += "/";
        // }
        // System.out.println("Mapping resources to: " + uploadPath);
        // registry.addResourceHandler("/uploads/**").addResourceLocations(uploadPath);
        // registry.addResourceHandler("/api/users/uploads/**").addResourceLocations(uploadPath);
    }
}