package com.qmg.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
public class AuthResourceTest {

    @Test
    public void testSignUp() {
        String signUpJson = """
            {
                "name": "Test User",
                "email": "test@example.com",
                "password": "password123"
            }
            """;

        given()
          .contentType(ContentType.JSON)
          .body(signUpJson)
          .when().post("/api/auth/signup")
          .then()
             .statusCode(200)
             .body("user", notNullValue())
             .body("user.email", is("test@example.com"))
             .body("token", notNullValue());
    }

    @Test
    public void testLogin() {
        // First sign up
        String signUpJson = """
            {
                "name": "Login Test User",
                "email": "login@example.com",
                "password": "password123"
            }
            """;

        given()
          .contentType(ContentType.JSON)
          .body(signUpJson)
          .when().post("/api/auth/signup");

        // Then login
        String loginJson = """
            {
                "email": "login@example.com",
                "password": "password123"
            }
            """;

        given()
          .contentType(ContentType.JSON)
          .body(loginJson)
          .when().post("/api/auth/login")
          .then()
             .statusCode(200)
             .body("user", notNullValue())
             .body("user.email", is("login@example.com"))
             .body("token", notNullValue());
    }

    @Test
    public void testLoginWithInvalidCredentials() {
        String loginJson = """
            {
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            """;

        given()
          .contentType(ContentType.JSON)
          .body(loginJson)
          .when().post("/api/auth/login")
          .then()
             .statusCode(401);
    }
}
