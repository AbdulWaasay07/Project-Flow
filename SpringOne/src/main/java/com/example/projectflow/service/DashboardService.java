package com.example.projectflow.service;

import com.example.projectflow.dto.dashboard.DashboardSummaryResponse;
import com.example.projectflow.dto.dashboard.ProjectProgressResponse;

import java.util.List;

public interface DashboardService {
    DashboardSummaryResponse getAdminDashboard();
    DashboardSummaryResponse getUserDashboard(String email);
    DashboardSummaryResponse getUserStatsById(Long userId);
    List<ProjectProgressResponse> getRecentProjectsProgress(String email, int limit);
}
