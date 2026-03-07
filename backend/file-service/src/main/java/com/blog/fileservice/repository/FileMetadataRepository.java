package com.blog.fileservice.repository;

import com.blog.fileservice.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    
    Optional<FileMetadata> findByStoredFileNameAndIsDeletedFalse(String storedFileName);
    
    Optional<FileMetadata> findBySeaweedfsFileIdAndIsDeletedFalse(String seaweedfsFileId);
    
    List<FileMetadata> findByUploadedByAndIsDeletedFalse(Long uploadedBy);
    
    List<FileMetadata> findByAccessLevelAndIsDeletedFalse(String accessLevel);
    
    List<FileMetadata> findByIsDeletedFalse();
    
    boolean existsByStoredFileNameAndIsDeletedFalse(String storedFileName);
}
