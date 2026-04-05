package com.example.projectflow.service.impl;

import com.example.projectflow.dto.comment.TaskCommentCreateRequest;
import com.example.projectflow.dto.comment.TaskCommentResponse;
import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.TaskComment;
import com.example.projectflow.entity.User;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.TaskCommentRepository;
import com.example.projectflow.repository.TaskRepository;
import com.example.projectflow.repository.UserRepository;
import com.example.projectflow.service.ActivityLogService;
import com.example.projectflow.service.NotificationService;
import com.example.projectflow.service.TaskCommentService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskCommentServiceImpl implements TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TaskCommentResponse addComment(Long taskId, TaskCommentCreateRequest request, String userEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        TaskComment comment = TaskComment.builder()
                .content(request.getContent())
                .task(task)
                .user(user)
                .build();

        TaskComment saved = taskCommentRepository.save(comment);
        
        activityLogService.log(user, task, AppConstants.ACTION_COMMENT, "Added comment to task: " + task.getTitle());
        
        // Notify task project owner if they are not the one commenting
        if (!task.getProject().getOwner().getEmail().equals(userEmail)) {
            notificationService.sendNotification(task.getProject().getOwner(), "New Comment", 
                user.getFullName() + " commented on task: " + task.getTitle());
        }

        return mapToResponse(saved);
    }

    @Override
    public List<TaskCommentResponse> getCommentsByTask(Long taskId) {
        return taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        TaskComment comment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException("Comment not found", HttpStatus.NOT_FOUND));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        // Only author or Admin can delete comment
        if (!comment.getUser().getEmail().equals(userEmail) && !user.getRole().getName().equals(AppConstants.ROLE_ADMIN)) {
            throw new CustomException("You don't have permission to delete this comment", HttpStatus.FORBIDDEN);
        }

        taskCommentRepository.delete(comment);
    }

    private TaskCommentResponse mapToResponse(TaskComment comment) {
        return TaskCommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .taskId(comment.getTask().getId())
                .authorName(comment.getUser().getFullName())
                .authorId(comment.getUser().getId())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
