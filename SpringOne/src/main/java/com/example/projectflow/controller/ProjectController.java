package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.project.*;
import com.example.projectflow.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "Endpoints for managing projects")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Create a new project")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectCreateRequest request, Authentication auth) {
        ProjectResponse response = projectService.createProject(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Update a project")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id, @Valid @RequestBody ProjectUpdateRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully",
                projectService.updateProject(id, request, auth.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a project (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id, Authentication auth) {
        projectService.deleteProject(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get project details")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully",
                projectService.getProjectById(id)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all projects")
    public ResponseEntity<ApiResponse<List<ProjectSummaryResponse>>> getAllProjects(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Projects retrieved successfully",
                projectService.getAllProjects(auth.getName())));
    }

    @PatchMapping("/{projectId}/assign-manager/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a manager to a project (Admin only)")
    public ResponseEntity<ApiResponse<Void>> assignManager(
            @PathVariable Long projectId, @PathVariable Long userId, Authentication auth) {
        projectService.assignManager(projectId, userId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Manager assigned successfully", null));
    }

    @PostMapping("/{projectId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Add a member to a project")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable Long projectId, @PathVariable Long userId, Authentication auth) {
        projectService.addMember(projectId, userId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Member added successfully", null));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Remove a member from a project")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long projectId, @PathVariable Long userId, Authentication auth) {
        projectService.removeMember(projectId, userId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }

    @GetMapping("/{projectId}/members")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all members of a project")
    public ResponseEntity<ApiResponse<List<ProjectResponse.MemberDto>>> getMembers(@PathVariable Long projectId) {
        ProjectResponse project = projectService.getProjectById(projectId);
        return ResponseEntity.ok(ApiResponse.success("Members retrieved", project.getMembers()));
    }
}
