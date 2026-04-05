package com.example.projectflow.service.impl;

import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.TaskStatusHistory;
import com.example.projectflow.entity.User;
import com.example.projectflow.repository.TaskStatusHistoryRepository;
import com.example.projectflow.service.TaskStatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskStatusHistoryServiceImpl implements TaskStatusHistoryService {

    private final TaskStatusHistoryRepository taskStatusHistoryRepository;

    @Override
    public void recordStatusChange(Task task, String oldStatus, String newStatus, User changedBy) {
        TaskStatusHistory history = TaskStatusHistory.builder()
                .task(task)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .build();
        taskStatusHistoryRepository.save(history);
    }
}
