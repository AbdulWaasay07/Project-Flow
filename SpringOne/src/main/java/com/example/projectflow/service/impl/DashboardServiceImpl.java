package com.example.projectflow.service.impl;

import com.example.projectflow.dto.dashboard.DashboardSummaryResponse;
import com.example.projectflow.dto.dashboard.ProjectProgressResponse;
import com.example.projectflow.dto.dashboard.WorkloadResponse;
import com.example.projectflow.entity.Project;
import com.example.projectflow.entity.User;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.*;
import com.example.projectflow.service.DashboardService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;

    @Override
    public DashboardSummaryResponse getAdminDashboard() {
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(AppConstants.PROJECT_STATUS_ONGOING);
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus(AppConstants.TASK_STATUS_DONE);
        long overdueTasks = taskRepository.countOverdueTasks(LocalDateTime.now(), AppConstants.TASK_STATUS_DONE);
        
        double completionRate = totalTasks > 0 ? (double) completedTasks * 100 / totalTasks : 0;

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .overallCompletionPercentage(completionRate)
                .teamWorkload(getTeamWorkload())
                .build();
    }

    @Override
    public DashboardSummaryResponse getUserDashboard(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        List<Long> projectIds = projectMemberRepository.findByUserId(user.getId())
                .stream().map(pm -> pm.getProject().getId()).collect(Collectors.toList());

        long totalProjects = projectIds.size();
        long totalTasks = 0;
        long completedTasks = 0;
        long overdueTasks = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Long pid : projectIds) {
            totalTasks += taskRepository.countByProjectId(pid);
            completedTasks += taskRepository.countByProjectIdAndStatus(pid, AppConstants.TASK_STATUS_DONE);
            overdueTasks += taskRepository.findByProjectIdAndStatus(pid, AppConstants.TASK_STATUS_TODO).stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now))
                    .count();
        }

        double completionRate = totalTasks > 0 ? (double) completedTasks * 100 / totalTasks : 0;

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .overallCompletionPercentage(completionRate)
                .build();
    }

    @Override
    public List<ProjectProgressResponse> getRecentProjectsProgress(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        return projectMemberRepository.findByUserId(user.getId()).stream()
                .limit(limit)
                .map(pm -> {
                    Project p = pm.getProject();
                    long total = taskRepository.countByProjectId(p.getId());
                    long completed = taskRepository.countByProjectIdAndStatus(p.getId(), AppConstants.TASK_STATUS_DONE);
                    double pct = total > 0 ? (double) completed * 100 / total : 0;
                    
                    return ProjectProgressResponse.builder()
                            .projectId(p.getId())
                            .projectName(p.getName())
                            .totalTasks(total)
                            .completedTasks(completed)
                            .completionPercentage(pct)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<WorkloadResponse> getTeamWorkload() {
        return userRepository.findAll().stream()
                .map(user -> {
                    long count = taskAssigneeRepository.findByUserId(user.getId()).size();
                    return WorkloadResponse.builder()
                            .userId(user.getId())
                            .userName(user.getFullName())
                            .taskCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
