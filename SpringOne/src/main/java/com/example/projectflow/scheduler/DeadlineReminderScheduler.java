package com.example.projectflow.scheduler;

import com.example.projectflow.entity.Task;
import com.example.projectflow.entity.TaskAssignee;
import com.example.projectflow.repository.TaskAssigneeRepository;
import com.example.projectflow.repository.TaskRepository;
import com.example.projectflow.service.NotificationService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeadlineReminderScheduler {

    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final NotificationService notificationService;

    // Run every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDeadlineReminders() {
        log.info("Running deadline reminder scheduler...");
        
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        List<Task> upcomingTasks = taskRepository.findByDueDateBeforeAndStatusNot(tomorrow, AppConstants.TASK_STATUS_DONE);
        
        for (Task task : upcomingTasks) {
            List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(task.getId());
            for (TaskAssignee ta : assignees) {
                notificationService.sendNotification(ta.getUser(), "Deadline Reminder", 
                    "Task '" + task.getTitle() + "' is due on " + task.getDueDate());
            }
        }
        
        log.info("Deadline reminder scheduler finished. Notified {} tasks.", upcomingTasks.size());
    }
}
