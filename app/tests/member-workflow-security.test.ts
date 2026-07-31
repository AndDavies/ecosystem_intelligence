import { describe, expect, it } from "vitest";
import { connectionRequestSchema, publicSubmissionSchema } from "../src/lib/beta/validation";
import {
  CONNECTION_DAILY_LIMIT,
  MEMBER_WORKFLOW_MAX_BODY_BYTES,
  SUBMISSION_DAILY_LIMIT,
  isMemberWorkflowQuotaError,
  memberWorkflowWindowStart,
  readBoundedJson
} from "../src/lib/security/bounded-json";

describe("signed-in public workflow boundaries", () => {
  it("accepts only the published contribution form contract", () => {
    const valid = {
      submissionType: "correction",
      targetEntityType: "organization",
      targetEntityId: "622647bd-e3e6-4caa-a56d-08dee4a61f05",
      payload: {
        subject: "Correct headquarters",
        details: "The official contact page lists a different Canadian office.",
        evidenceUrl: "https://example.ca/contact",
        submitterRole: "Employee"
      }
    };
    expect(publicSubmissionSchema.safeParse(valid).success).toBe(true);
    expect(publicSubmissionSchema.safeParse({
      ...valid,
      payload: { ...valid.payload, privateNotes: { unrestricted: true } }
    }).success).toBe(false);
    expect(publicSubmissionSchema.safeParse({
      ...valid,
      payload: { ...valid.payload, evidenceUrl: "http://example.ca/contact" }
    }).success).toBe(false);
  });

  it("keeps connection fields strict and bounded", () => {
    const valid = {
      organizationId: "622647bd-e3e6-4caa-a56d-08dee4a61f05",
      requesterName: "Alex Analyst",
      requesterOrganization: "Canadian Partner",
      intent: "partnership",
      message: "I would like to discuss a public-source partnership opportunity."
    };
    expect(connectionRequestSchema.safeParse(valid).success).toBe(true);
    expect(connectionRequestSchema.safeParse({ ...valid, administratorOverride: true }).success).toBe(false);
  });

  it("rejects oversized request bodies before parsing", async () => {
    const oversized = JSON.stringify({ value: "x".repeat(MEMBER_WORKFLOW_MAX_BODY_BYTES) });
    const result = await readBoundedJson(new Request("https://truenorthmap.ca/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: oversized
    }));
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("uses explicit rolling-day quotas and safe database error recognition", () => {
    expect(SUBMISSION_DAILY_LIMIT).toBe(10);
    expect(CONNECTION_DAILY_LIMIT).toBe(5);
    expect(memberWorkflowWindowStart(new Date("2026-07-31T12:00:00.000Z"))).toBe("2026-07-30T12:00:00.000Z");
    expect(isMemberWorkflowQuotaError({ code: "P0001", message: "Daily submission limit reached." })).toBe(true);
    expect(isMemberWorkflowQuotaError({ code: "40001", message: "Database retry." })).toBe(false);
  });
});
