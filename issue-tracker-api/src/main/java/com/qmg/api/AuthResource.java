package com.qmg.api;

import com.qmg.api.dto.AuthResponse;
import com.qmg.api.dto.LoginRequest;
import com.qmg.api.dto.SignUpRequest;
import com.qmg.api.dto.UserResponse;
import com.qmg.domain.User;
import io.quarkus.security.UnauthorizedException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.mindrot.jbcrypt.BCrypt;

import java.time.Instant;
import java.util.UUID;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    // Simple JWT-like token generation (for MVP - in production use proper JWT library)
    private String generateToken(java.util.UUID userId) {
        return "token-" + userId + "-" + UUID.randomUUID();
    }

    @POST
    @Path("/signup")
    @Transactional
    public Response signUp(SignUpRequest request) {
        if (User.findByEmail(request.email) != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"error\":\"Email already exists\"}")
                    .build();
        }

        User user = new User();
        user.id = UUID.randomUUID();
        user.email = request.email;
        user.name = request.name;
        user.passwordHash = BCrypt.hashpw(request.password, BCrypt.gensalt());
        user.createdAt = Instant.now();
        user.updatedAt = Instant.now();
        user.persist();

        String token = generateToken(user.id);
        UserResponse userResponse = new UserResponse(user.id, user.email, user.name, user.createdAt);

        return Response.ok(new AuthResponse(token, userResponse)).build();
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        User user = User.findByEmail(request.email);
        if (user == null || !BCrypt.checkpw(request.password, user.passwordHash)) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = generateToken(user.id);
        UserResponse userResponse = new UserResponse(user.id, user.email, user.name, user.createdAt);

        return Response.ok(new AuthResponse(token, userResponse)).build();
    }
}
