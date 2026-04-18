package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.dashboard.DashboardSummaryResponse;
import com.example.projectflow.dto.dashboard.ProjectProgressResponse;
import com.example.projectflow.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Analytics and metrics")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get global system dashboard (Admin only)")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Global dashboard retrieved", 
                dashboardService.getAdminDashboard()));
    }

    @GetMapping("/me")
    @Operation(summary = "Get personal dashboard metrics")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getUserDashboard(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("User dashboard retrieved", 
                dashboardService.getUserDashboard(auth.getName())));
    }

    @GetMapping("/projects-progress")
    @Operation(summary = "Get progress of user's projects")
    public ResponseEntity<ApiResponse<List<ProjectProgressResponse>>> getProjectsProgress(
            Authentication auth, 
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Project progress retrieved", 
                dashboardService.getRecentProjectsProgress(auth.getName(), limit)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get dashboard stats for a specific user (Admin/Manager only)")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getUserStats(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("User stats retrieved",
                dashboardService.getUserStatsById(userId)));
    }
}
