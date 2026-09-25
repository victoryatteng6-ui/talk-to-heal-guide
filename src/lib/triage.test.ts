import { describe, expect, it } from "vitest";
import { detectEmergency } from "./triage";

describe("detectEmergency", () => {
  it.each([
    "I have severe chest pain",
    "I cannot breathe properly",
    "Someone is unconscious",
    "There is heavy bleeding",
    "I think this is a stroke",
    "They are having a seizure",
    "I think they overdosed",
    "I want to kill myself",
  ])("flags emergency language: %s", (message) => {
    expect(detectEmergency(message)).toBe(true);
  });

  it.each([
    "",
    "I have a mild headache",
    "My skin is itchy",
    "What foods contain iron?",
    "I have had a cough for two days",
  ])("does not flag ordinary health questions: %s", (message) => {
    expect(detectEmergency(message)).toBe(false);
  });

  it("does not throw for empty or whitespace input", () => {
    expect(detectEmergency("")).toBe(false);
    expect(detectEmergency("   ")).toBe(false);
  });
});
