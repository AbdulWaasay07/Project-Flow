package com.example.projectflow.controller;

import com.example.projectflow.dto.auth.AuthResponse;
import com.example.projectflow.dto.auth.LoginRequest;
import com.example.projectflow.dto.auth.RegisterRequest;
import com.example.projectflow.repository.UserRepository;
import com.example.projectflow.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public endpoints for user authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT token")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/test")
    @Operation(summary = "Basic authentication API health check")
    public String test() {
        return "API working";
    }

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/db-test")
    @Operation(summary = "Database connectivity check")
    public long testDb() {
        return userRepository.count();
    }
}
