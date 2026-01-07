package com.qmg.api;

import com.qmg.api.dto.AddMemberRequest;
import com.qmg.api.dto.CreateProjectRequest;
import com.qmg.api.dto.PaginatedResponse;
import com.qmg.api.dto.UpdateMemberRoleRequest;
import com.qmg.api.dto.UpdateProjectRequest;
import com.qmg.domain.Project;
import com.qmg.domain.ProjectMember;
import com.qmg.domain.UserRole;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Path("/api/projects")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProjectResource {

    @jakarta.inject.Inject
    WebSocketService webSocketService;

    @GET
    public PaginatedResponse<Project> list(
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("pageSize") @DefaultValue("20") int pageSize,
            @QueryParam("sortBy") @DefaultValue("createdAt") String sortBy,
            @QueryParam("sortOrder") @DefaultValue("desc") String sortOrder
    ) {
        io.quarkus.panache.common.Page panachePage = Page.of(page - 1, pageSize);
        Sort sort = Sort.by(sortBy).direction(sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.Ascending : Sort.Direction.Descending);

        List<Project> projects = Project.findAll(sort).page(panachePage).list();
        long total = Project.count();

        return new PaginatedResponse<>(projects, total, page, pageSize);
    }

    @GET
    @Path("/{id}")
    public Project get(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        Project project = Project.findById(id);
        if (project == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        return project;
    }

    @POST
    @Transactional
    public Project create(CreateProjectRequest request) {
        Project project = new Project();
        project.id = UUID.randomUUID();
        project.name = request.name;
        project.description = request.description;
        project.ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001"); // TODO: Get from auth context
        project.createdAt = Instant.now();
        project.updatedAt = Instant.now();
        project.persist();

        // Add owner as project member with OWNER role
        ProjectMember ownerMember = new ProjectMember();
        ownerMember.id = UUID.randomUUID();
        ownerMember.project = project;
        ownerMember.userId = project.ownerId;
        ownerMember.role = UserRole.OWNER;
        ownerMember.addedAt = Instant.now();
        ownerMember.persist();

        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastProjectCreated(project);
        }

        return project;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Project update(@PathParam("id") String idParam, UpdateProjectRequest request) {
        UUID id = UUID.fromString(idParam);
        Project project = Project.findById(id);
        if (project == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        // Optimistic locking check
        if (request.version != null && !request.version.equals(project.version)) {
            throw new jakarta.ws.rs.ClientErrorException(jakarta.ws.rs.core.Response.Status.CONFLICT);
        }

        if (request.name != null) {
            project.name = request.name;
        }
        if (request.description != null) {
            project.description = request.description;
        }
        project.updatedAt = Instant.now();

        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastProjectUpdated(project);
        }

        return project;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        Project.deleteById(id);
    }

    // Project members endpoints
    @GET
    @Path("/{id}/members")
    public List<ProjectMember> getMembers(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        return ProjectMember.findByProjectId(id);
    }

    @POST
    @Path("/{id}/members")
    @Transactional
    public ProjectMember addMember(@PathParam("id") String idParam, AddMemberRequest request) {
        UUID id = UUID.fromString(idParam);
        Project project = Project.findById(id);
        if (project == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        // Check if member already exists
        ProjectMember existing = ProjectMember.findByProjectAndUser(id, request.userId);
        if (existing != null) {
            throw new jakarta.ws.rs.BadRequestException("User is already a member of this project");
        }

        ProjectMember member = new ProjectMember();
        member.id = UUID.randomUUID();
        member.project = project;
        member.userId = request.userId;
        member.role = UserRole.valueOf(request.role.toUpperCase());
        member.addedAt = Instant.now();
        member.persist();

        return member;
    }

    @DELETE
    @Path("/{id}/members/{userId}")
    @Transactional
    public void removeMember(@PathParam("id") String idParam, @PathParam("userId") String userIdParam) {
        UUID id = UUID.fromString(idParam);
        UUID userId = UUID.fromString(userIdParam);
        ProjectMember member = ProjectMember.findByProjectAndUser(id, userId);
        if (member == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        ProjectMember.deleteById(member.id);
    }

    @PATCH
    @Path("/{id}/members/{userId}")
    @Transactional
    public ProjectMember updateMemberRole(
            @PathParam("id") String idParam,
            @PathParam("userId") String userIdParam,
            UpdateMemberRoleRequest request
    ) {
        UUID id = UUID.fromString(idParam);
        UUID userId = UUID.fromString(userIdParam);
        ProjectMember member = ProjectMember.findByProjectAndUser(id, userId);
        if (member == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        member.role = UserRole.valueOf(request.role.toUpperCase());
        return member;
    }
}
