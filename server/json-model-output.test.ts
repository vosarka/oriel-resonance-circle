import { describe, expect, it } from "vitest";
import { parseModelJson } from "./_core/json";

describe("model JSON parser", () => {
  it("parses clean JSON", () => {
    expect(parseModelJson<{ value: string }>('{"value":"ok"}')).toEqual({ value: "ok" });
  });

  it("parses fenced JSON", () => {
    expect(parseModelJson<{ value: string }>('```json\n{"value":"ok"}\n```')).toEqual({ value: "ok" });
  });

  it("extracts the first JSON value when a model appends prose", () => {
    expect(parseModelJson<{ value: string }>('{"value":"ok"}\nExtra explanation.')).toEqual({ value: "ok" });
  });

  it("keeps braces inside strings intact while extracting", () => {
    expect(parseModelJson<{ value: string }>('{"value":"{ok}"} trailing')).toEqual({ value: "{ok}" });
  });
});
