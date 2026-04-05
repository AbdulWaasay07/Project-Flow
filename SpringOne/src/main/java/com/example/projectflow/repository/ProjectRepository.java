package com.example.projectflow.repository;

import com.example.projectflow.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findByStatus(String status);
    
    long count();
    long countByOwnerId(Long ownerId);
    long countByStatus(String status);
}
