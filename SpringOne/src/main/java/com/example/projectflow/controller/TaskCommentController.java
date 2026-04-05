package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.comment.TaskCommentCreateRequest;
import com.example.projectflow.dto.comment.TaskCommentResponse;
import com.example.projectflow.service.TaskCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
@Tag(name = "Task Comments", description = "Endpoints for managing task comments")
public class TaskCommentController {

    private final TaskCommentService taskCommentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add a comment to a task")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> addComment(
            @PathVariable Long taskId, @Valid @RequestBody TaskCommentCreateRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully",
                        taskCommentService.addComment(taskId, request, auth.getName())));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all comments for a task")
    public ResponseEntity<ApiResponse<List<TaskCommentResponse>>> getComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully",
                taskCommentService.getCommentsByTask(taskId)));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long taskId, @PathVariable Long commentId, Authentication auth) {
        taskCommentService.deleteComment(commentId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", null));
    }
}
