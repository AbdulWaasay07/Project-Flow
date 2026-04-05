package com.example.projectflow.service;

import com.example.projectflow.dto.user.UserProfileResponse;
import com.example.projectflow.dto.user.UserResponse;
import com.example.projectflow.dto.user.UserUpdateRequest;

import org.springframework.lang.NonNull;
import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(@NonNull Long id);
    UserProfileResponse getUserProfile(String email);
    UserProfileResponse updateProfile(String email, UserUpdateRequest request);
    void blockUser(@NonNull Long id);
    void unblockUser(@NonNull Long id);
    void changeUserRole(@NonNull Long id, String roleName);
}
