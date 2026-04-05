package com.example.projectflow.service;

import com.example.projectflow.dto.comment.TaskCommentCreateRequest;
import com.example.projectflow.dto.comment.TaskCommentResponse;

import java.util.List;

public interface TaskCommentService {
    TaskCommentResponse addComment(Long taskId, TaskCommentCreateRequest request, String userEmail);
    List<TaskCommentResponse> getCommentsByTask(Long taskId);
    void deleteComment(Long commentId, String userEmail);
}
