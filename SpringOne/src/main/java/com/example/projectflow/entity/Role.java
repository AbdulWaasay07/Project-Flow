package com.example.projectflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // ADMIN, MANAGER, TEAM_MEMBER

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "role")
    private List<User> users;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
