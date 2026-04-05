package com.example.projectflow.repository;

import com.example.projectflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    long countByStatus(String status);
    List<Task> findByStatus(String status);
    List<Task> findByProjectIdAndStatus(Long projectId, String status);
    List<Task> findByDueDateBeforeAndStatusNot(LocalDateTime date, String status);
    
    long countByProjectId(Long projectId);
    long countByProjectIdAndStatus(Long projectId, String status);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Task t WHERE t.dueDate < :now AND t.status != :status")
    long countOverdueTasks(@org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now, @org.springframework.data.repository.query.Param("status") String status);
}
