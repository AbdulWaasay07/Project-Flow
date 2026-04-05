package com.example.projectflow.service;

import com.example.projectflow.dto.activity.ActivityLogResponse;
import com.example.projectflow.entity.Project;
import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ActivityLogService {
    void log(User user, Project project, Task task, String action, String details);
    void log(User user, Project project, String action, String details);
    void log(User user, Task task, String action, String details);

    Page<ActivityLogResponse> getAllLogs(Pageable pageable);
    Page<ActivityLogResponse> getLogsByProject(Long projectId, Pageable pageable);
    Page<ActivityLogResponse> getLogsByTask(Long taskId, Pageable pageable);
    Page<ActivityLogResponse> getLogsByUser(Long userId, Pageable pageable);
}
