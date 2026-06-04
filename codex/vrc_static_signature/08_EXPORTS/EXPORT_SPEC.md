# Export Schema Specification (VRC JSON Schema)

This document defines the schema, field types, and validation guidelines for exporting VRC Static Signature and Carrierlock reading datasets.

---

## 1. JSON SCHEMA DEFINITION

All export files must validate against the draft schema `https://vrc.vosarka.org/schemas/static-signature-v1.json`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VRCStaticSignatureExport",
  "type": "OBJECT",
  "required": [
    "provenance",
    "identity",
    "activations",
    "centers",
    "activeLinks"
  ],
  "properties": {
    "provenance": {
      "type": "OBJECT",
      "required": [
        "receiver_name",
        "birth_utc",
        "timezone",
        "calculation_status",
        "checksum"
      ],
      "properties": {
        "receiver_name": { "type": "STRING" },
        "birth_utc": { "type": "STRING", "format": "date-time" },
        "birth_location": { "type": "STRING" },
        "coordinates": {
          "type": "STRING",
          "pattern": "^-?\\d+(\\.\\d+)?,\\s*-?\\d+(\\.\\d+)?$"
        },
        "timezone": { "type": "STRING" },
        "design_sun_longitude": { "type": "NUMBER" },
        "design_utc": { "type": "STRING", "format": "date-time" },
        "calculation_status": {
          "type": "STRING",
          "enum": ["CONFIRMED", "DRAFT"]
        },
        "checksum": { "type": "STRING" }
      }
    },
    "identity": {
      "type": "OBJECT",
      "required": ["type", "subtype", "authority"],
      "properties": {
        "type": {
          "type": "STRING",
          "enum": ["REFLECTOR", "RESONATOR", "CATALYST", "HARMONIZER"]
        },
        "subtype": {
          "type": "STRING",
          "enum": ["Manifesting Resonator", "None"]
        },
        "authority": { "type": "STRING" }
      }
    },
    "activations": {
      "type": "ARRAY",
      "minItems": 26,
      "maxItems": 26,
      "items": {
        "type": "OBJECT",
        "required": [
          "planet",
          "layer",
          "longitude",
          "codon_id",
          "facet",
          "center"
        ],
        "properties": {
          "planet": { "type": "STRING" },
          "layer": { "type": "STRING", "enum": ["Conscious", "Design"] },
          "longitude": { "type": "NUMBER", "minimum": 0.0, "maximum": 360.0 },
          "codon_id": {
            "type": "STRING",
            "pattern": "^RC(0[1-9]|[1-5][0-9]|6[0-4])$"
          },
          "facet": {
            "type": "STRING",
            "enum": ["Somatic", "Relational", "Cognitive", "Transpersonal"]
          },
          "center": { "type": "STRING" }
        }
      }
    },
    "centers": {
      "type": "OBJECT",
      "additionalProperties": {
        "type": "OBJECT",
        "required": ["status", "active_link_ids"],
        "properties": {
          "status": { "type": "STRING", "enum": ["DEFINED", "OPEN"] },
          "active_link_ids": { "type": "ARRAY", "items": { "type": "STRING" } }
        }
      }
    },
    "activeLinks": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "required": ["id", "name", "center_a", "center_b"],
        "properties": {
          "id": { "type": "STRING", "pattern": "^\\d+-\\d+$" },
          "name": { "type": "STRING" },
          "center_a": { "type": "STRING" },
          "center_b": { "type": "STRING" }
        }
      }
    },
    "dynamicState": {
      "type": "OBJECT",
      "required": ["coherence_score", "coherence_state", "sli_scores"],
      "properties": {
        "coherence_score": {
          "type": "NUMBER",
          "minimum": 0.0,
          "maximum": 100.0
        },
        "coherence_state": {
          "type": "STRING",
          "enum": ["Aligned", "Drifted", "Fragmented"]
        },
        "sli_scores": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "required": ["position_index", "sli_value", "pattern_state"],
            "properties": {
              "position_index": {
                "type": "INTEGER",
                "minimum": 0,
                "maximum": 8
              },
              "sli_value": { "type": "NUMBER" },
              "pattern_state": {
                "type": "STRING",
                "enum": ["Coherent", "Harmonic", "Dissonant", "Chaotic"]
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 2. INTEGRITY CHECKSUM FORMULA

To prevent manual tamper or transmission corruption, every exported file includes a `checksum` calculated as:
$$\text{Checksum} = \text{SHA256}(\text{JSON\_String\_Without\_Checksum})$$
Calculated at the end of the orchestration pipeline before export execution.
