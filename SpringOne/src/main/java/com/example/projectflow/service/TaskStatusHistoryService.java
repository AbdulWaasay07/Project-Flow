package com.example.projectflow.service;

import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.User;

public interface TaskStatusHistoryService {
    void recordStatusChange(Task task, String oldStatus, String newStatus, User changedBy);
}
