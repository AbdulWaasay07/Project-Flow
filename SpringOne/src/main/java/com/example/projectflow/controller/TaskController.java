package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.task.*;
import com.example.projectflow.service.TaskService;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "Endpoints for managing tasks")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskCreateRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully",
                        taskService.createTask(request, auth.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Update a task")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id, @Valid @RequestBody TaskUpdateRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully",
                taskService.updateTask(id, request, auth.getName())));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change task status")
    public ResponseEntity<ApiResponse<TaskResponse>> changeStatus(
            @PathVariable Long id, @Valid @RequestBody TaskStatusUpdateRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Task status updated successfully",
                taskService.changeStatus(id, request, auth.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Delete a task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id, Authentication auth) {
        taskService.deleteTask(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get task details")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Task retrieved successfully",
                taskService.getTaskById(id)));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get tasks by project")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully",
                taskService.getTasksByProject(projectId)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Get all tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks() {
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully",
                taskService.getAllTasks()));
    }

    @PostMapping("/{taskId}/assign")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Assign users to a task")
    public ResponseEntity<ApiResponse<Void>> assignUsers(
            @PathVariable Long taskId, @Valid @RequestBody TaskAssigneeRequest request, Authentication auth) {
        taskService.assignUsers(taskId, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Users assigned successfully", null));
    }

    @DeleteMapping("/{taskId}/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Unassign a user from a task")
    public ResponseEntity<ApiResponse<Void>> unassignUser(
            @PathVariable Long taskId, @PathVariable Long userId, Authentication auth) {
        taskService.unassignUser(taskId, userId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("User unassigned successfully", null));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Get overdue tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getOverdueTasks() {
        return ResponseEntity.ok(ApiResponse.success("Overdue tasks retrieved successfully",
                taskService.getOverdueTasks()));
    }
}
