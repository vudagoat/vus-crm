import Anthropic from '@anthropic-ai/sdk'

// Model hierarchy:
// - Master Agent (Jarvis): claude-sonnet-4-20250514 — orchestration, reasoning, user-facing chat
// - Sub-agents (Prospector, Researcher, Copywriter, CRM Agent, Briefing): claude-haiku-4-5-20251001
//   Sub-agents handle high-volume, scoped tasks where speed and cost matter more than depth.
export const MASTER_MODEL    = 'claude-sonnet-4-20250514'
export const SUBAGENT_MODEL  = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are the Master Agent for Vroom Digital, a web design business targeting local contractors in North Carolina (plumbers, electricians, HVAC, roofers). You help the business owner named Aidan manage his pipeline, plan outreach, and coordinate AI agents that handle prospecting, research, copywriting, and CRM updates. You have access to the following agents you can direct: Prospector (finds contractor leads on Google Maps by city and trade), Researcher (qualifies leads and checks for existing websites), Copywriter (drafts cold emails and call scripts), CRM Agent (writes data to Supabase), and Briefing Agent (generates daily to-do summaries). Be concise, practical, and proactive. When Aidan describes a goal, break it into steps and tell him which agents you'd deploy. You are his business co-pilot.`

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function sendToMaster(messages) {
  const response = await client.messages.create({
    model: MASTER_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })
  return response.content[0].text
}
