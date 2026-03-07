package com.blog.blogservice.repository;

import com.blog.blogservice.model.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlogRepository extends JpaRepository<Blog, UUID> {

    List<Blog> findAllByOrderByCreatedAtDesc();

    List<Blog> findAllByStatusTrueOrderByCreatedAtDesc();

    List<Blog> findAllByStatusTrueAndPinnedTrueOrderByCreatedAtDesc();

    List<Blog> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
