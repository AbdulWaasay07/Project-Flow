package com.example.projectflow.service.impl;

import com.example.projectflow.dto.user.UserProfileResponse;
import com.example.projectflow.dto.user.UserResponse;
import com.example.projectflow.dto.user.UserUpdateRequest;
import com.example.projectflow.entity.Role;
import com.example.projectflow.entity.User;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.RoleRepository;
import com.example.projectflow.repository.UserRepository;
import com.example.projectflow.service.UserService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserById(@NonNull Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        return mapToUserResponse(user);
    }

    @Override
    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        return mapToUserProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UserUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        user.setFullName(request.getFullName());

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return mapToUserProfileResponse(updatedUser);
    }

    @Override
    @Transactional
    public void blockUser(@NonNull Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        
        user.setStatus(AppConstants.STATUS_BLOCKED);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unblockUser(@NonNull Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        
        user.setStatus(AppConstants.STATUS_ACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changeUserRole(@NonNull Long id, String roleName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
                
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new CustomException("Role not found", HttpStatus.NOT_FOUND));
                
        user.setRole(role);
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
