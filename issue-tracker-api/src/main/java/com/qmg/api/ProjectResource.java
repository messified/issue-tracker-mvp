package com.qmg.api;

import com.qmg.domain.Project;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/projects")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProjectResource {

    @GET
    public List<Project> list() {
        return Project.listAll();
    }

    @GET
    @Path("/{id}")
    public Project get(@PathParam("id") Long id) {
        return Project.findById(id);
    }

    @POST
    @Transactional
    public Project create(Project project) {
        project.persist();
        return project;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Project update(@PathParam("id") Long id, Project updated) {
        Project project = Project.findById(id);
        if (project == null) {
            throw new NotFoundException();
        }

        project.name = updated.name;
        project.ownerId = updated.ownerId;
        return project;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        Project.deleteById(id);
    }
}
