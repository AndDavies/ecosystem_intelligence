import { hasOpenAiEnv } from "@/lib/supabase/env";

export interface EnrichmentInput {
  entityType: string;
  entityId: string;
  title: string;
  evidence: string[];
}

export interface EnrichmentOutput {
  whyItMatters: string;
  suggestedActionType: string;
  rationale: string;
}

export async function runEnrichment(input: EnrichmentInput): Promise<EnrichmentOutput> {
  if (!hasOpenAiEnv()) {
    return {
      whyItMatters: `Development placeholder for ${input.title}. Configure OPENAI_API_KEY to enable live enrichment.`,
      suggestedActionType: "monitor_for_later_stage_engagement",
      rationale: "No OpenAI API key configured."
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are enriching a capability-intelligence record. Respond with JSON containing whyItMatters, suggestedActionType, and rationale."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "enrichment_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              whyItMatters: {
                type: "string"
              },
              suggestedActionType: {
                type: "string"
              },
              rationale: {
                type: "string"
              }
            },
            required: ["whyItMatters", "suggestedActionType", "rationale"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI enrichment failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  if (!payload.output_text) {
    throw new Error("OpenAI enrichment returned no output.");
  }

  return JSON.parse(payload.output_text) as EnrichmentOutput;
}
