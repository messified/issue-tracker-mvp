package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "user_id"}))
public class ProjectMember extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne
    public Project project;

    @Column(nullable = false, name = "user_id")
    public UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public UserRole role;

    public Instant addedAt;

    public static ProjectMember findByProjectAndUser(UUID projectId, UUID userId) {
        return find("project.id = ?1 and userId = ?2", projectId, userId).firstResult();
    }

    public static java.util.List<ProjectMember> findByProjectId(UUID projectId) {
        return find("project.id", projectId).list();
    }
}
