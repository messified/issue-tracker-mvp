package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
public class Project extends PanacheEntityBase {

    @Id
    public UUID id;

    @Column(nullable = false)
    public String name;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(nullable = false)
    public UUID ownerId;

    @Version
    public Long version;

    public Instant createdAt;
    public Instant updatedAt;
}
