package com.example.projectflow.service;

import com.example.projectflow.dto.auth.AuthResponse;
import com.example.projectflow.dto.auth.LoginRequest;
import com.example.projectflow.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
