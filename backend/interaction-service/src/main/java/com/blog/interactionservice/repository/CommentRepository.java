package com.blog.interactionservice.repository;

import com.blog.interactionservice.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByBlogIdOrderByCreatedAtDesc(UUID blogId);

    List<Comment> findByBlogIdAndParentIdIsNullOrderByCreatedAtDesc(UUID blogId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);

    Long countByBlogId(UUID blogId);
}
