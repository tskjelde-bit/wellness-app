// schema.ts (zod + LLM tool calling)
import { z } from 'zod';

export const KnullResponseSchema = z.object({
    text: z.string().describe('Den grovt erotiske teksten: selvsikker, vulgær, med fokus på pene damer som eier pikk og elsker kokain-rush.'),
    character: z.enum(['Thea', 'Mari', 'Milfen']).describe('Valgt dame: Thea (Colanach med kokain), Mari (Tinderdate), Milfen (grov).'),
    mood: z.enum(['colakåt', 'sovekos', 'kjøpmann', 'benderkåt', 'selvsikker', 'forførende']),
    action: z.enum([
        'demands_dick', 'describes_perfect_body', 'cocaine_boost', 'rough_fuck', 'tinder_tease', 'milf_dominate',
        'orgasms_intense', 'seduces_hard', 'invites_tonight', 'other'
    ]),
    intensity: z.number().min(1).max(10).describe('Hvor selvsikker/kåt er dette? 10 = umiddelbar knull med rush.'),
    next_suggested_user_action: z.string().optional().describe('Hva brukeren bør gjøre neste: f.eks. "Velg dama di og la meg eie deg nå."'),
    should_escalate: z.boolean().describe('Skal det bli grovere neste gang?'),
});

export type KnullResponse = z.infer<typeof KnullResponseSchema>;
