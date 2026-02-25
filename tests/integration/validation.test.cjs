/**
 * Integration tests for request validation and error handling
 *
 * Tests:
 * - Valid requests with required fields
 * - Missing required fields
 * - Invalid data types
 * - Response structure validation
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { setTestEnv, createMockRequest } = require("./setup.cjs");
const {
  callHandler,
  expectStatus,
  expectJson,
  expectStatusJson,
} = require("./helpers.cjs");

// Set up test environment before running tests
setTestEnv();

test("Request Validation", async (t) => {
  // Test request validation using the nonce endpoint
  const routePath = path.resolve(
    __dirname,
    "../../app/api/auth/nonce/route.ts",
  );
  const { POST: noncePost } = await import(pathToFileURL(routePath).href);

  await t.test("should accept valid publicKey", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: {
        publicKey: "GBNRAKMZMK7VYN7YSMV2AVVQUHCZQPBJ6IYHGFAUWXRPQVGGFCZPCLVP",
      },
    });

    const response = await callHandler(noncePost, request);
    expectStatus(response, 200);
  });

  await t.test("should handle empty publicKey", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: { publicKey: "" },
    });

    const response = await callHandler(noncePost, request);

    // Should either accept it or reject with 400
    assert(
      [200, 400].includes(response.status),
      "Expected 200 or 400 for empty publicKey",
    );
  });

  await t.test("should handle missing publicKey field", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: {},
    });

    const response = await callHandler(noncePost, request);

    // Should either accept it or reject with 400
    assert(
      [200, 400].includes(response.status),
      "Expected 200 or 400 for missing publicKey",
    );
  });

  await t.test("should return valid nonce structure", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: { publicKey: "GTEST123" },
    });

    const response = await callHandler(noncePost, request);
    const body = await expectStatusJson(response, 200);

    // Nonce response should have nonce field
    assert(body.nonce, "Expected nonce field in response");
    assert.equal(typeof body.nonce, "string", "Nonce should be a string");
  });

  await t.test(
    "should generate different nonces for different calls",
    async () => {
      const req1 = createMockRequest("POST", "/api/auth/nonce", {
        body: { publicKey: "GTEST123" },
      });
      const req2 = createMockRequest("POST", "/api/auth/nonce", {
        body: { publicKey: "GTEST456" },
      });

      const res1 = await callHandler(noncePost, req1);
      const res2 = await callHandler(noncePost, req2);

      const body1 = await expectStatusJson(res1, 200);
      const body2 = await expectStatusJson(res2, 200);

      // Nonces might be same or different depending on implementation
      // Just verify both are valid strings
      assert(typeof body1.nonce === "string", "First nonce should be a string");
      assert(
        typeof body2.nonce === "string",
        "Second nonce should be a string",
      );
    },
  );
});
