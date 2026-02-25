/**
 * Integration tests for POST /api/auth/* routes
 *
 * Tests:
 * - POST /api/auth/nonce - Get a nonce for signing
 *
 * Note: login/logout tests require Next.js request context (cookies, etc)
 * Those are covered in E2E tests with full server context.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { setTestEnv, createMockRequest } = require("./setup.cjs");
const { callHandler, expectStatusJson } = require("./helpers.cjs");

// Set up test environment before running tests
setTestEnv();

test("POST /api/auth/nonce", async (t) => {
  // Dynamically import the route handler
  const routePath = path.resolve(
    __dirname,
    "../../app/api/auth/nonce/route.ts",
  );
  const { POST: noncePost } = await import(pathToFileURL(routePath).href);

  await t.test(
    "should return 200 with nonce when publicKey provided",
    async () => {
      const request = createMockRequest("POST", "/api/auth/nonce", {
        body: { publicKey: "GTEST123" },
      });

      const response = await callHandler(noncePost, request);
      const body = await expectStatusJson(response, 200);

      // Should return a nonce
      assert(body.nonce, "Expected nonce in response");
      assert.equal(
        typeof body.nonce,
        "string",
        "Expected nonce to be a string",
      );
    },
  );

  await t.test("should handle missing publicKey gracefully", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: {},
    });

    const response = await callHandler(noncePost, request);

    // Current implementation might not validate, but it should not crash
    // At minimum, it should return 200 or 400
    assert([200, 400].includes(response.status), "Expected 200 or 400");
  });

  await t.test("should have consistent response format", async () => {
    const request = createMockRequest("POST", "/api/auth/nonce", {
      body: {
        publicKey: "GBNRAKMZMK7VYN7YSMV2AVVQUHCZQPBJ6IYHGFAUWXRPQVGGFCZPCLVP",
      },
    });

    const response = await callHandler(noncePost, request);
    const body = await expectStatusJson(response, 200);

    // Nonce should be a non-empty string
    assert(
      body.nonce && typeof body.nonce === "string",
      "Nonce must be a non-empty string",
    );
    assert(body.nonce.length > 0, "Nonce should not be empty");
  });
});
