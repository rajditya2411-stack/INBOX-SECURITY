import { Router, type Request, type Response } from "express";

const router = Router();

type SupportedProvider = "openai" | "gemini" | "anthropic" | "grok";

function getEffectiveApiKey(provider: string, clientKey?: string): string {
  if (clientKey && clientKey.trim()) return clientKey.trim();

  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "gemini":
      return process.env.GEMINI_API_KEY || "";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "grok":
      return process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
    default:
      return "";
  }
}

function getDefaultModel(provider: string, customModel?: string): string {
  if (customModel && customModel.trim()) return customModel.trim();
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "gemini":
      return "gemini-1.5-flash";
    case "anthropic":
      return "claude-3-5-haiku-20241022";
    case "grok":
      return "grok-beta";
    default:
      return "default";
  }
}

const SYSTEM_PROMPT = `You are Security Guard AI, an expert cybersecurity assistant embedded in an open-source email client.
Your role is to evaluate email messages alongside local deterministic rule engine findings and return an executive threat summary.

Return ONLY a valid JSON object with no markdown formatting, using this exact structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.95,
  "summary": "1-2 concise sentences explaining the threat or confirming safety.",
  "reasons": ["Key finding 1", "Key finding 2"],
  "recommendedAction": "Actionable recommendation for the user."
}`;

async function callOpenAI(apiKey: string, model: string, userPrompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const rawText = data.choices?.[0]?.message?.content || "";
  return JSON.parse(rawText);
}

async function callGemini(apiKey: string, model: string, userPrompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUSER PROMPT:\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(rawText);
}

async function callAnthropic(apiKey: string, model: string, userPrompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const rawText = data.content?.[0]?.text || "";
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

async function callGrok(apiKey: string, model: string, userPrompt: string) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Grok API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const rawText = data.choices?.[0]?.message?.content || "";
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

router.post("/ai/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, apiKey, model, message, analysis } = req.body || {};

    if (!provider || provider === "none") {
      res.json({
        available: false,
        providerId: "none",
        error: "AI Provider is set to None. Deterministic security engine remains fully active.",
      });
      return;
    }

    const effectiveKey = getEffectiveApiKey(provider, apiKey);
    if (!effectiveKey) {
      res.json({
        available: false,
        providerId: provider,
        error: `API Key is missing for ${provider.toUpperCase()}. Set key in Settings or server environment.`,
      });
      return;
    }

    const selectedModel = getDefaultModel(provider, model);

    const userPrompt = `
EMAIL TO ANALYZE:
- Sender: ${message?.senderName || "Unknown"} <${message?.senderEmail || "unknown@example.com"}>
- Subject: ${message?.subject || "(No Subject)"}
- Content Snippet: ${Array.isArray(message?.body) ? message.body.slice(0, 3).join("\n") : message?.preview || ""}
- Attachments: ${message?.attachments ? message.attachments.map((a: { name: string }) => a.name).join(", ") : "None"}

LOCAL DETERMINISTIC SECURITY ENGINE RESULTS:
- Risk Level: ${analysis?.riskLevel || "UNKNOWN"}
- Score: ${analysis?.score ?? "N/A"}
- Signals Detected: ${Array.isArray(analysis?.signals) ? analysis.signals.join(", ") : "None"}
- Initial Recommendation: ${analysis?.recommendation || "None"}
- SPF: ${analysis?.authentication?.spf || "UNAVAILABLE"}, DKIM: ${analysis?.authentication?.dkim || "UNAVAILABLE"}, DMARC: ${analysis?.authentication?.dmarc || "UNAVAILABLE"}

Please evaluate these deterministic findings and return the structured JSON threat analysis.
`;

    let parsedResult: any;

    switch (provider as SupportedProvider) {
      case "openai":
        parsedResult = await callOpenAI(effectiveKey, selectedModel, userPrompt);
        break;
      case "gemini":
        parsedResult = await callGemini(effectiveKey, selectedModel, userPrompt);
        break;
      case "anthropic":
        parsedResult = await callAnthropic(effectiveKey, selectedModel, userPrompt);
        break;
      case "grok":
        parsedResult = await callGrok(effectiveKey, selectedModel, userPrompt);
        break;
      default:
        res.json({
          available: false,
          providerId: provider,
          error: `Unsupported AI provider "${provider}". Supported: openai, gemini, anthropic, grok.`,
        });
        return;
    }

    res.json({
      available: true,
      providerId: provider,
      modelUsed: selectedModel,
      riskLevel: parsedResult.riskLevel || analysis?.riskLevel || "LOW",
      confidence: parsedResult.confidence ?? 0.9,
      summary: parsedResult.summary || "AI analysis completed.",
      reasons: parsedResult.reasons || analysis?.signals || [],
      recommendedAction: parsedResult.recommendedAction || analysis?.recommendation || "No action required.",
    });
  } catch (error: any) {
    req.log?.error({ error }, "AI Analysis failed");
    res.json({
      available: false,
      providerId: req.body?.provider || "unknown",
      error: error?.message || "An error occurred during AI analysis.",
    });
  }
});

router.post("/ai/test", async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, apiKey, model } = req.body || {};

    if (!provider || provider === "none") {
      res.json({ success: false, message: "Please select an active AI provider." });
      return;
    }

    const effectiveKey = getEffectiveApiKey(provider, apiKey);
    if (!effectiveKey) {
      res.json({ success: false, message: `API key is missing for ${provider.toUpperCase()}.` });
      return;
    }

    const selectedModel = getDefaultModel(provider, model);
    const testPrompt = 'Respond with exact JSON: {"status": "ok"}';

    let result: any;
    if (provider === "openai") result = await callOpenAI(effectiveKey, selectedModel, testPrompt);
    else if (provider === "gemini") result = await callGemini(effectiveKey, selectedModel, testPrompt);
    else if (provider === "anthropic") result = await callAnthropic(effectiveKey, selectedModel, testPrompt);
    else if (provider === "grok") result = await callGrok(effectiveKey, selectedModel, testPrompt);
    else throw new Error(`Unsupported provider ${provider}`);

    if (result) {
      res.json({ success: true, message: `Successfully connected to ${provider.toUpperCase()} (${selectedModel}).` });
    } else {
      res.json({ success: false, message: "Received empty response from AI provider." });
    }
  } catch (error: any) {
    res.json({ success: false, message: error?.message || "Connection test failed." });
  }
});

export default router;
