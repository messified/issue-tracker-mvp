package com.qmg.api;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class HealthResourceTest {

    @Test
    public void testLiveness() {
        given()
          .when().get("/health/live")
          .then()
             .statusCode(200)
             .body("status", is("UP"));
    }

    @Test
    public void testReadiness() {
        given()
          .when().get("/health/ready")
          .then()
             .statusCode(200)
             .body("status", is("UP"));
    }
}
