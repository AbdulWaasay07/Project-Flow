package com.example.projectflow.service;

import com.example.projectflow.dto.task.*;

import java.util.List;

public interface TaskService {
    TaskResponse createTask(TaskCreateRequest request, String userEmail);
    TaskResponse updateTask(Long id, TaskUpdateRequest request, String userEmail);
    TaskResponse changeStatus(Long id, TaskStatusUpdateRequest request, String userEmail);
    void deleteTask(Long id, String userEmail);
    TaskResponse getTaskById(Long id);
    List<TaskResponse> getTasksByProject(Long projectId);
    List<TaskResponse> getAllTasks();
    void assignUsers(Long taskId, TaskAssigneeRequest request, String userEmail);
    void unassignUser(Long taskId, Long userId, String userEmail);
    List<TaskResponse> getOverdueTasks();
}
