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
        long totalMembers = userRepository.count();
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus(AppConstants.TASK_STATUS_DONE);
        long overdueTasks = taskRepository.countOverdueTasks(LocalDateTime.now(), AppConstants.TASK_STATUS_DONE);
        
        double completionRate = totalTasks > 0 ? (double) completedTasks * 100 / totalTasks : 0;

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalMembers(totalMembers)
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
        long activeProjects = projectIds.stream()
                .filter(pid -> projectRepository.findById(pid)
                        .map(p -> AppConstants.PROJECT_STATUS_ONGOING.equals(p.getStatus()))
                        .orElse(false))
                .count();
        long totalTasks = 0;
        long completedTasks = 0;
        long overdueTasks = 0;
        LocalDateTime now = LocalDateTime.now();

        // Count overdue = tasks past due date that are NOT done (any non-DONE status)
        for (Long pid : projectIds) {
            totalTasks += taskRepository.countByProjectId(pid);
            completedTasks += taskRepository.countByProjectIdAndStatus(pid, AppConstants.TASK_STATUS_DONE);
            overdueTasks += taskRepository.findByProjectId(pid).stream()
                    .filter(t -> !AppConstants.TASK_STATUS_DONE.equals(t.getStatus())
                            && t.getDueDate() != null
                            && t.getDueDate().isBefore(now))
                    .count();
        }

        double completionRate = totalTasks > 0 ? (double) completedTasks * 100 / totalTasks : 0;

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .overallCompletionPercentage(completionRate)
                .build();
    }

    @Override
    public DashboardSummaryResponse getUserStatsById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        List<Long> projectIds = projectMemberRepository.findByUserId(user.getId())
                .stream().map(pm -> pm.getProject().getId()).collect(Collectors.toList());

        long totalProjects = projectIds.size();
        long activeProjects = projectIds.stream()
                .filter(pid -> projectRepository.findById(pid)
                        .map(p -> AppConstants.PROJECT_STATUS_ONGOING.equals(p.getStatus()))
                        .orElse(false))
                .count();
        long totalTasks = 0;
        long completedTasks = 0;
        long overdueTasks = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Long pid : projectIds) {
            totalTasks += taskRepository.countByProjectId(pid);
            completedTasks += taskRepository.countByProjectIdAndStatus(pid, AppConstants.TASK_STATUS_DONE);
            overdueTasks += taskRepository.findByProjectId(pid).stream()
                    .filter(t -> !AppConstants.TASK_STATUS_DONE.equals(t.getStatus())
                            && t.getDueDate() != null
                            && t.getDueDate().isBefore(now))
                    .count();
        }

        double completionRate = totalTasks > 0 ? (double) completedTasks * 100 / totalTasks : 0;

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
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

        boolean isAdmin = AppConstants.ROLE_ADMIN.equals(user.getRole().getName());

        List<Project> projects;
        if (isAdmin) {
            projects = projectRepository.findAll();
        } else {
            projects = projectMemberRepository.findByUserId(user.getId()).stream()
                    .map(pm -> pm.getProject())
                    .collect(Collectors.toList());
        }

        return projects.stream()
                .limit(limit)
                .map(p -> {
                    long total = taskRepository.countByProjectId(p.getId());
                    long completed = taskRepository.countByProjectIdAndStatus(p.getId(), AppConstants.TASK_STATUS_DONE);
                    double pct = total > 0 ? (double) completed * 100 / total : 0;

                    // Manager: first project member with MANAGER role
                    List<com.example.projectflow.entity.ProjectMember> managers =
                            projectMemberRepository.findByProjectIdAndRole(p.getId(), AppConstants.PROJECT_ROLE_MANAGER);
                    String managerName = managers.isEmpty() ? "—" : managers.get(0).getUser().getFullName();

                    // Derived status: COMPLETED when all tasks done (and there are tasks), else actual status
                    String derivedStatus = (total > 0 && completed == total) ? "COMPLETED" : p.getStatus();

                    return ProjectProgressResponse.builder()
                            .projectId(p.getId())
                            .projectName(p.getName())
                            .managerName(managerName)
                            .projectStatus(derivedStatus)
                            .totalTasks(total)
                            .completedTasks(completed)
                            .completionPercentage(pct)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<WorkloadResponse> getTeamWorkload() {
        return userRepository.findAll().stream()
                .filter(user -> !AppConstants.ROLE_ADMIN.equals(user.getRole().getName()))
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
