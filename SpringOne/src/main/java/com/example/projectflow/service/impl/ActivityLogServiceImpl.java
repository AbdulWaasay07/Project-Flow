package com.example.projectflow.service.impl;

import com.example.projectflow.dto.activity.ActivityLogResponse;
import com.example.projectflow.entity.ActivityLog;
import com.example.projectflow.entity.Project;
import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.User;
import com.example.projectflow.repository.ActivityLogRepository;
import com.example.projectflow.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Override
    public void log(User user, Project project, Task task, String action, String details) {
        ActivityLog activityLog = ActivityLog.builder()
                .user(user)
                .project(project)
                .task(task)
                .action(action)
                .details(details)
                .build();
        activityLogRepository.save(activityLog);
        log.info("Activity: {} by {} - {}", action, user.getEmail(), details);
    }

    @Override
    public void log(User user, Project project, String action, String details) {
        log(user, project, null, action, details);
    }

    @Override
    public void log(User user, Task task, String action, String details) {
        log(user, task.getProject(), task, action, details);
    }

    @Override
    public Page<ActivityLogResponse> getAllLogs(Pageable pageable) {
        return activityLogRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public Page<ActivityLogResponse> getLogsByProject(Long projectId, Pageable pageable) {
        return activityLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<ActivityLogResponse> getLogsByTask(Long taskId, Pageable pageable) {
        return activityLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<ActivityLogResponse> getLogsByUser(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userEmail(log.getUser().getEmail())
                .userName(log.getUser().getFullName())
                .projectId(log.getProject() != null ? log.getProject().getId() : null)
                .projectName(log.getProject() != null ? log.getProject().getName() : null)
                .taskId(log.getTask() != null ? log.getTask().getId() : null)
                .taskTitle(log.getTask() != null ? log.getTask().getTitle() : null)
                .action(log.getAction())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
