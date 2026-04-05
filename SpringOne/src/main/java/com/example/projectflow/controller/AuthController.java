package com.example.projectflow.controller;

import com.example.projectflow.dto.auth.AuthResponse;
import com.example.projectflow.dto.auth.LoginRequest;
import com.example.projectflow.dto.auth.RegisterRequest;
import com.example.projectflow.repository.UserRepository;
import com.example.projectflow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/test")
    public String test() {
        return "API working";
    }

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/db-test")
    public long testDb() {
        return userRepository.count();
    }
}
