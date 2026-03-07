package com.blog.fileservice.service;

import com.blog.fileservice.config.SeaweedFSConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SeaweedFSService {
    
    private static final Logger log = LoggerFactory.getLogger(SeaweedFSService.class);
    
    private final SeaweedFSConfig seaweedFSConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public SeaweedFSService(SeaweedFSConfig seaweedFSConfig, RestTemplate restTemplate) {
        this.seaweedFSConfig = seaweedFSConfig;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Upload file to SeaweedFS using Filer API
     * @param file The multipart file to upload
     * @return Map containing fileId and publicUrl
     * @throws Exception if upload fails
     */
    public Map<String, String> uploadFile(MultipartFile file) throws Exception {
        try {
            log.info("Starting upload to SeaweedFS - filename: {}, size: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            // Generate unique file path
            String fileName = UUID.randomUUID().toString();
            if (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) {
                String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
                fileName = fileName + extension;
            }
            
            // Upload to SeaweedFS Filer
            String uploadUrl = seaweedFSConfig.getFilerUrl() + "/uploads/" + fileName;
            log.debug("Uploading to SeaweedFS Filer URL: {}", uploadUrl);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> uploadResponse = restTemplate.postForEntity(uploadUrl, requestEntity, String.class);
            
            if (!uploadResponse.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to upload to SeaweedFS - Status: {}, Response: {}", 
                        uploadResponse.getStatusCode(), uploadResponse.getBody());
                throw new RuntimeException("Failed to upload file to SeaweedFS Filer. Status: " + uploadResponse.getStatusCode());
            }
            
            log.info("Successfully uploaded file to SeaweedFS - fileId: {}", fileName);
            
            // Return file information
            Map<String, String> result = new HashMap<>();
            result.put("fileId", fileName);
            result.put("publicUrl", seaweedFSConfig.getFilerUrl() + "/uploads/" + fileName);
            
            return result;
        } catch (IOException e) {
            log.error("Failed to read file data: {}", e.getMessage(), e);
            throw new Exception("Failed to read file data: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to upload file to SeaweedFS: {}", e.getMessage(), e);
            throw new Exception("Failed to upload file to SeaweedFS: " + e.getMessage(), e);
        }
    }
    
    /**
     * Download file from SeaweedFS Filer
     * @param fileId The SeaweedFS file ID (filename)
     * @return byte array of the file
     * @throws Exception if download fails
     */
    public byte[] downloadFile(String fileId) throws Exception {
        try {
            String downloadUrl = seaweedFSConfig.getFilerUrl() + "/uploads/" + fileId;
            
            ResponseEntity<byte[]> response = restTemplate.getForEntity(downloadUrl, byte[].class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to download file from SeaweedFS. Status: " + response.getStatusCode());
            }
            
            return response.getBody();
        } catch (Exception e) {
            throw new Exception("Failed to download file from SeaweedFS: " + e.getMessage(), e);
        }
    }
    
    /**
     * Delete file from SeaweedFS Filer
     * @param fileId The SeaweedFS file ID (filename)
     * @return true if deletion was successful
     * @throws Exception if deletion fails
     */
    public boolean deleteFile(String fileId) throws Exception {
        String deleteUrl = seaweedFSConfig.getFilerUrl() + "/uploads/" + fileId;
        
        try {
            restTemplate.delete(deleteUrl);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from SeaweedFS: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check if file exists in SeaweedFS Filer
     * @param fileId The SeaweedFS file ID (filename)
     * @return true if file exists
     */
    public boolean fileExists(String fileId) {
        try {
            String checkUrl = seaweedFSConfig.getFilerUrl() + "/uploads/" + fileId;
            ResponseEntity<String> response = restTemplate.exchange(
                    checkUrl,
                    HttpMethod.HEAD,
                    null,
                    String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
