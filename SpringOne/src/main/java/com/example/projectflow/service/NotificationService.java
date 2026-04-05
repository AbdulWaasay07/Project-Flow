package com.example.projectflow.service;

import com.example.projectflow.dto.notification.NotificationResponse;
import com.example.projectflow.entity.User;

import java.util.List;

public interface NotificationService {
    void sendNotification(User user, String title, String message);
    List<NotificationResponse> getUserNotifications(String userEmail);
    void markAsRead(Long notificationId);
    void markAllAsRead(String userEmail);
    long getUnreadCount(String userEmail);
}
