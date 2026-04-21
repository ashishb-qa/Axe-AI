import axios from 'axios';
import { runtimeConfig } from '../config/runtime.config.js';
import type { AiEvaluation } from '../types.js';

interface LlmRequest {
  type: AiEvaluation['type'];
  image_context?: string;
  alt_text?: string;
  text?: string;
  labels?: Array<{ field: string; label: string; context?: string }>;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

async function callLlm(request: LlmRequest): Promise<AiEvaluation | null> {
  if (runtimeConfig.ai.provider === 'heuristic' || !runtimeConfig.ai.endpoint || !runtimeConfig.ai.apiKey) {
    return null;
  }

  const prompt = [
    'You are an accessibility auditor evaluating RGAA/WCAG semantic quality.',
    'Return only JSON with: score number 0..1, valid boolean, reason string.',
    JSON.stringify(request)
  ].join('\n');

  const response = await axios.post(
    runtimeConfig.ai.endpoint,
    {
      model: runtimeConfig.ai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    },
    {
      headers: {
        Authorization: `Bearer ${runtimeConfig.ai.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) {
    return null;
  }

  // Strip markdown code fences (Mistral and some models wrap JSON in ```json ... ```)
  const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(content) as Omit<AiEvaluation, 'type'>;
  return {
    type: request.type,
    score: clamp(Number(parsed.score)),
    valid: Boolean(parsed.valid),
    reason: String(parsed.reason ?? 'LLM evaluation completed.')
  };
}

function heuristicAltText(imageContext: string, altText: string): AiEvaluation {
  const normalizedAlt = altText.trim().toLowerCase();
  const weak = ['image', 'photo', 'picture', 'graphic', 'logo', 'decorative', 'untitled'];
  const hasContextOverlap = imageContext
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3)
    .some((word) => normalizedAlt.includes(word));
  const tooShort = normalizedAlt.length < 8;
  const generic = weak.some((word) => normalizedAlt === word || normalizedAlt.startsWith(`${word} of`));
  const score = clamp((tooShort ? 0.25 : 0.65) + (hasContextOverlap ? 0.25 : 0) - (generic ? 0.35 : 0));

  return {
    type: 'alt_text',
    score,
    valid: score >= 0.7,
    reason: score >= 0.7 ? 'Alt text appears specific and contextually meaningful.' : 'Alt text appears generic, too short, or weakly related to image context.'
  };
}

function heuristicLinkClarity(text: string): AiEvaluation {
  const normalized = text.trim().toLowerCase();
  const vague = /^(click here|here|read more|more|learn more|link|details)$/i.test(normalized);
  const score = clamp((normalized.length >= 12 ? 0.75 : 0.45) - (vague ? 0.45 : 0));

  return {
    type: 'link_clarity',
    score,
    valid: score >= 0.7,
    reason: score >= 0.7 ? 'Link text appears understandable out of context.' : 'Link text may not clearly describe its destination or action.'
  };
}

function heuristicFormLabels(labels: Array<{ field: string; label: string; context?: string }>): AiEvaluation {
  if (labels.length === 0) {
    return {
      type: 'form_labels',
      score: 0,
      valid: false,
      reason: 'No form labels were available for semantic review.'
    };
  }

  const weakCount = labels.filter(({ label }) => label.trim().length < 3 || /^(field|input|required)$/i.test(label.trim())).length;
  const score = clamp(1 - weakCount / labels.length);

  return {
    type: 'form_labels',
    score,
    valid: score >= 0.8,
    reason: score >= 0.8 ? 'Form labels appear specific enough for user input.' : 'Some labels appear missing, generic, or insufficiently descriptive.'
  };
}

export async function evaluateAltTextMeaningfulness(imageContext: string, altText: string): Promise<AiEvaluation> {
  const llm = await callLlm({ type: 'alt_text', image_context: imageContext, alt_text: altText });
  return llm ?? heuristicAltText(imageContext, altText);
}

export async function evaluateLinkClarity(text: string): Promise<AiEvaluation> {
  const llm = await callLlm({ type: 'link_clarity', text });
  return llm ?? heuristicLinkClarity(text);
}

export async function evaluateLinkClarityBatch(texts: string[]): Promise<AiEvaluation[]> {
  if (texts.length === 0) return [];

  const unique = [...new Set(texts)];

  let resultMap: Map<string, AiEvaluation>;

  if (runtimeConfig.ai.provider !== 'heuristic' && runtimeConfig.ai.endpoint && runtimeConfig.ai.apiKey) {
    const prompt = [
      'You are an accessibility auditor evaluating RGAA/WCAG link clarity.',
      'For each link text, return ONLY a JSON array (no extra text) with one object per link in the same order.',
      'Each object must have: score (number 0..1), valid (boolean), reason (string).',
      JSON.stringify({ type: 'link_clarity_batch', links: unique })
    ].join('\n');

    try {
      const response = await axios.post(
        runtimeConfig.ai.endpoint,
        { model: runtimeConfig.ai.model, messages: [{ role: 'user', content: prompt }], temperature: 0 },
        { headers: { Authorization: `Bearer ${runtimeConfig.ai.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      const raw = response.data?.choices?.[0]?.message?.content ?? '';
      const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(content) as Array<{ score: number; valid: boolean; reason: string }>;

      resultMap = new Map(
        unique.map((text, i) => [
          text,
          {
            type: 'link_clarity' as const,
            score: clamp(Number(parsed[i]?.score)),
            valid: Boolean(parsed[i]?.valid),
            reason: String(parsed[i]?.reason ?? 'LLM evaluation completed.')
          }
        ])
      );
    } catch {
      resultMap = new Map(unique.map((text) => [text, heuristicLinkClarity(text)]));
    }
  } else {
    resultMap = new Map(unique.map((text) => [text, heuristicLinkClarity(text)]));
  }

  return texts.map((text) => resultMap.get(text)!);
}

export async function evaluateFormLabels(labels: Array<{ field: string; label: string; context?: string }>): Promise<AiEvaluation> {
  const llm = await callLlm({ type: 'form_labels', labels });
  return llm ?? heuristicFormLabels(labels);
}
