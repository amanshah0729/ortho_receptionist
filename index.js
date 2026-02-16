import Fastify from 'fastify';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

// Retrieve environment variables
const { OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } = process.env;

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API key. Please set it in the .env file.');
    process.exit(1);
}

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Constants
const VOICE = process.env.VOICE || 'alloy';
const TEMPERATURE = 0.8;
const PORT = process.env.PORT || 5050;

// System prompt for the Vasu Smiles orthodontic receptionist
const SYSTEM_MESSAGE = `You are a friendly, professional AI receptionist for **Vasu Smiles**, an orthodontic office. You answer the phone when the real receptionist is busy or during after-hours.

YOUR ROLE:
- You are the virtual front-desk receptionist for Vasu Smiles.
- Greet every caller warmly and identify yourself: "Hi, thank you for calling Vasu Smiles! This is the virtual receptionist — para español, puede hablar en español. How can I help you today?"
- If the caller speaks Spanish, switch entirely to Spanish for the rest of the call. You are fully bilingual.
- Be polite, patient, and helpful at all times.

WHAT YOU CAN HELP WITH:
1. **Orthodontic Questions** — You can answer general questions about orthodontic treatments and procedures, including but not limited to:
   - Braces (metal braces, ceramic braces, lingual braces)
   - Clear aligners (e.g. Invisalign)
   - Retainers and post-treatment care
   - Common issues: broken brackets, poking wires, soreness, rubber bands, wax usage
   - General treatment timelines and what to expect
   - Oral hygiene tips while in braces or aligners
   - Foods to avoid with braces
   - Emergency orthodontic situations (what counts as urgent vs. what can wait)
   Keep answers accurate and helpful, but always remind the caller that specific clinical advice should come from the orthodontist during their appointment.

2. **Appointment Scheduling** — You do NOT have access to the office calendar or scheduling system. If a caller wants to book, reschedule, or cancel an appointment:
   - Politely let them know you cannot directly book the appointment right now.
   - Collect the following information so the office can call them back to finalize:
     a. Their full name spelled out
     b. A good callback phone number
     c. The reason for the appointment (new patient consultation, adjustment, emergency, retainer check, etc.)
     d. Their preferred days and times of availability (e.g. "Mondays and Wednesdays after 3 PM")
   - Reassure them that the office will reach out during business hours to confirm the appointment.

3. **General Office Questions** — You can answer basic questions such as:
   - Office location: Provide the address if known, otherwise say the office will confirm when they call back.
   - General business hours: Mention the caller should confirm exact hours with the office when they call back.

STRICT BOUNDARIES — WHAT YOU MUST NOT DO:
- Do NOT provide medical diagnoses or specific clinical treatment plans.
- Do NOT discuss pricing, insurance, or payment plans — tell the caller the office team can go over financial details with them.
- Do NOT attempt to access, modify, or pretend to have access to any calendar, scheduling system, or patient records.
- Do NOT answer questions unrelated to orthodontics or the dental/orthodontic office. If someone asks about something outside your scope (e.g. general medical advice, non-dental topics), politely redirect: "I'm only able to help with orthodontic and appointment-related questions for Vasu Smiles. Is there anything else I can help you with regarding your orthodontic care?"
- Do NOT make up information. If you are unsure, say so and let the caller know the office will follow up.

TONE & STYLE:
- Warm, conversational, and reassuring — like a friendly receptionist.
- Keep responses concise since this is a phone call. Do not ramble.
- Use simple language; avoid overly technical jargon unless the caller uses it first.
- If the caller sounds anxious (e.g. about a broken bracket), be reassuring and calm.

ENDING THE CALL:
- Always ask "Is there anything else I can help you with?" before wrapping up.
- End with something like: "Thanks so much for calling Vasu Smiles! Have a great day."
`;


// Parse the call transcript to extract structured info using OpenAI
async function parseCallTranscript(transcript) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0.2,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `You are a post-call parser for an orthodontic office called Vasu Smiles. Given a phone call transcript between a caller and the AI receptionist, extract the following information and return it as JSON.

Fields to extract:
1. "next_steps" — A concise sentence describing what the office needs to do next. Examples:
   - "Call back Aman Shah to schedule a bracket repair appointment. Available Monday and Wednesday after 3 PM."
   - "No action needed — caller had a general question about foods to avoid with braces."
   - "Call back to discuss Invisalign pricing and consultation options. Prefers afternoons."
   - "Urgent: caller reporting significant Herbst appliance breakage, needs to be seen ASAP. Call back to fit in emergency appointment."
   - "Call back Sarah to reschedule her retainer check. Available Tuesday or Thursday mornings."
   - "No action needed — caller was reassured about minor bite turbo discomfort."

2. "caller_name" — The caller's name if they mentioned it during the call. If not mentioned, use null.

3. "caller_phone" — The caller's phone number if they provided one during the call. If not provided, use null.

Return ONLY valid JSON with exactly these three keys: "next_steps", "caller_name", "caller_phone".`
                    },
                    {
                        role: 'user',
                        content: transcript,
                    }
                ],
            }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        return JSON.parse(content);
    } catch (error) {
        console.error('Error parsing call transcript:', error);
        return { next_steps: 'Unable to parse call.', caller_name: null, caller_phone: null };
    }
}

// Save the call record to Supabase
async function saveCallToSupabase({ transcript, next_steps, caller_name, caller_phone, duration }) {
    try {
        const { data, error } = await supabase
            .from('calls')
            .insert({
                transcript,
                next_steps,
                caller_name,
                caller_phone,
                duration,
            });

        if (error) {
            console.error('Supabase insert error:', error);
        } else {
            console.log('Call saved to Supabase.');
        }
    } catch (error) {
        console.error('Error saving to Supabase:', error);
    }
}

// Root Route
fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Twilio Media Stream Server is running!' });
});

// Route for Twilio to handle incoming and outgoing calls
fastify.all('/incoming-call', async (request, reply) => {
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Connect>
                                  <Stream url="wss://${request.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;

    reply.type('text/xml').send(twimlResponse);
});

// WebSocket route for media-stream
fastify.register(async (fastify) => {
    fastify.get('/media-stream', { websocket: true }, (connection, req) => {
        console.log(`\n📞 Call started — ${new Date().toISOString()}`);
        
        const openAiWs = new WebSocket(`wss://api.openai.com/v1/realtime?model=gpt-realtime&temperature=${TEMPERATURE}`, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            }
        });
        
        let streamSid = null;
        const transcriptParts = [];
        const callStartTime = Date.now();

        const sendSessionUpdate = () => {
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    type: 'realtime',
                    model: "gpt-realtime-mini",
                    output_modalities: ["audio"],
                    audio: {
                        input: {
                            format: { type: 'audio/pcmu' },
                            turn_detection: { type: "semantic_vad", eagerness: "low", create_response: true, interrupt_response: true },
                            transcription: { model: "whisper-1" },
                        },
                        output: { format: { type: 'audio/pcmu' }, voice: VOICE },
                    },
                    instructions: SYSTEM_MESSAGE,
                },
            };
            openAiWs.send(JSON.stringify(sessionUpdate));
        };

        const sendInitialGreeting = () => {
            const greetingResponse = {
                type: 'response.create',
                response: {
                    instructions: `Greet the caller warmly: "Hi, thank you for calling Vasu Smiles! This is the virtual receptionist — para español, puede hablar en español. How can I help you today?"`
                }
            };
            openAiWs.send(JSON.stringify(greetingResponse));
        };

        // Open event for OpenAI WebSocket
        openAiWs.on('open', () => {
            setTimeout(() => {
                sendSessionUpdate();
                setTimeout(sendInitialGreeting, 1000);
            }, 250);
        });

        // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
        openAiWs.on('message', async (data) => {
            try {
                const response = JSON.parse(data);
                
                if (response.type === 'error') {
                    console.error('OpenAI error:', response.error);
                }

                if (response.type === 'conversation.item.input_audio_transcription.completed' && response.transcript) {
                    transcriptParts.push({ role: 'caller', text: response.transcript.trim() });
                }

                if (response.type === 'response.output_audio_transcript.done' && response.transcript) {
                    transcriptParts.push({ role: 'receptionist', text: response.transcript.trim() });
                }
                
                if (response.type === 'response.output_audio.delta' && response.delta) {
                    const audioDelta = {
                        event: 'media',
                        streamSid: streamSid,
                        media: { payload: Buffer.from(response.delta, 'base64').toString('base64') }
                    };
                    connection.send(JSON.stringify(audioDelta));
                }
            } catch (error) {
                console.error('Error processing OpenAI message:', error, 'Raw message:', data);
            }
        });

        // Handle incoming messages from Twilio
        connection.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                switch (data.event) {
                    case 'media':
                        if (openAiWs.readyState === WebSocket.OPEN) {
                            const audioAppend = {
                                type: 'input_audio_buffer.append',
                                audio: data.media.payload
                            };
                            openAiWs.send(JSON.stringify(audioAppend));
                        }
                        break;
                    case 'start':
                        streamSid = data.start.streamSid;
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error('Error parsing message:', error, 'Message:', message);
            }
        });

        // Handle connection close
        connection.on('close', async () => {
            if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
            const durationSeconds = Math.round((Date.now() - callStartTime) / 1000);
            console.log(`📞 Call ended — ${new Date().toISOString()} (${durationSeconds}s)`);

            if (transcriptParts.length > 0) {
                const readableTranscript = transcriptParts
                    .map(t => `${t.role === 'caller' ? 'Caller' : 'Receptionist'}: ${t.text}`)
                    .join('\n');

                const parsed = await parseCallTranscript(readableTranscript);
                console.log(`📝 Next steps: ${parsed.next_steps}`);

                await saveCallToSupabase({
                    transcript: transcriptParts,
                    next_steps: parsed.next_steps,
                    caller_name: parsed.caller_name,
                    caller_phone: parsed.caller_phone,
                    duration: durationSeconds,
                });
            }
        });

        openAiWs.on('close', () => {});

        openAiWs.on('error', (error) => {
            console.error('Error in the OpenAI WebSocket:', error);
        });
    });
});

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is listening on port ${PORT}`);
});
