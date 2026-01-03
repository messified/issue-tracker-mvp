package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;

@Entity
public class Project extends PanacheEntity {

    public String name;
    public Long ownerId;
}
