
// FIX: Import GenerateContentResponse to properly type the return value from the Gemini API.
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import type { Prompt, ArtisticStyle, TextModel, ImageModel, Gender, SubjectSpecificDetails, NegativePrompt } from '../types';

const USAGE_STORAGE_KEY = 'apiUsageStats';

// --- API Usage Tracking ---

type ApiUsage = { defaultKey: number; userKey: number };

export const getApiUsage = (): ApiUsage => {
    try {
        const storedUsage = localStorage.getItem(USAGE_STORAGE_KEY);
        if (storedUsage) {
            const parsed = JSON.parse(storedUsage);
            return {
                defaultKey: typeof parsed.defaultKey === 'number' ? parsed.defaultKey : 0,
                userKey: typeof parsed.userKey === 'number' ? parsed.userKey : 0,
            };
        }
    } catch (e) {
        console.error("Failed to read API usage stats from localStorage", e);
    }
    return { defaultKey: 0, userKey: 0 };
};

const incrementApiUsage = (isUserKey: boolean) => {
    const currentUsage = getApiUsage();
    const newUsage = {
        ...currentUsage,
        [isUserKey ? 'userKey' : 'defaultKey']: currentUsage[isUserKey ? 'userKey' : 'defaultKey'] + 1,
    };
    try {
        localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
    } catch (e) {
        console.error("Failed to save API usage stats to localStorage", e);
    }
};

export const resetApiUsage = (): ApiUsage => {
    const defaultUsage = { defaultKey: 0, userKey: 0 };
    try {
        localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(defaultUsage));
    } catch (e) {
        console.error("Failed to reset API usage stats in localStorage", e);
    }
    return defaultUsage;
};

// --- Retry Logic for Transient Errors ---
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const isTransientError = (e: unknown): boolean => {
    if (e instanceof Error) {
        const errorMessage = e.message.toLowerCase();
        // Check for common transient error indicators
        return errorMessage.includes('503') || 
               errorMessage.includes('unavailable') ||
               errorMessage.includes('overloaded') ||
               errorMessage.includes('internal error') ||
               errorMessage.includes('network error');
    }
    return false;
};

const withRetry = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    let lastError: unknown = new Error('API call failed after multiple retries.');
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await apiCall();
        } catch (e) {
            lastError = e;
            if (isTransientError(e) && i < MAX_RETRIES - 1) { // Only wait if it's not the last attempt
                const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000; // Add jitter
                console.warn(`Transient error detected. Retrying in ${Math.round(backoffTime)}ms... (Attempt ${i + 1}/${MAX_RETRIES})`, e);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            } else {
                // Not a transient error, or last attempt failed, so re-throw
                throw e;
            }
        }
    }
    throw lastError;
};


// --- Gemini Client Initialization ---

const getAiClient = (apiKey?: string | null): GoogleGenAI => {
    const finalApiKey = apiKey || process.env.API_KEY;
    if (!finalApiKey) {
        throw new Error("API key is not configured. Please provide your own key in the settings or ensure the API_KEY environment variable is set.");
    }
    return new GoogleGenAI({ apiKey: finalApiKey });
};

const subjectDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        costume: { type: Type.STRING, description: "Description of the subject's clothing and accessories." },
        subject_expression: { type: Type.STRING, description: "A specific facial expression for the subject." },
        subject_action: { type: Type.STRING, description: "A specific, subtle action the subject is performing." },
    },
    required: ["costume", "subject_expression", "subject_action"],
};

// Fix: Added a responseSchema to enforce a JSON object structure for the response,
// improving reliability based on Gemini API best practices.
const promptSchema = {
    type: Type.OBJECT,
    properties: {
        prompt: { type: Type.STRING, description: "A main instruction string summarizing the concept for the image generation model." },
        details: {
            type: Type.OBJECT,
            properties: {
                year: { type: Type.STRING, description: "A specific year or era (e.g., 1985, Cyberpunk Future, Ancient Rome)." },
                genre: { type: Type.STRING, description: "A specific genre, style, or artistic medium." },
                location: { type: Type.STRING, description: "A vivid description of the setting." },
                lighting: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A description of the lighting, can be multiple values." },
                camera_angle: { type: Type.STRING, description: "A specific camera angle." },
                emotion: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The dominant emotion(s) of the scene." },
                color_palette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The key color(s) of the scene." },
                atmosphere: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A rich, evocative description of the overall mood and atmosphere." },
                environmental_elements: { type: Type.STRING, description: "Key dynamic or static elements in the environment." },
                subject1: subjectDetailsSchema,
                subject2: subjectDetailsSchema, // Optional in the type, but we can require it in the prompt
                negative_prompt: {
                    type: Type.OBJECT,
                    properties: {
                        exclude_visuals: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        exclude_styles: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        exclude_colors: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        exclude_objects: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['exclude_visuals', 'exclude_styles']
                }
            },
            required: ["year", "genre", "location", "lighting", "camera_angle", "emotion", "color_palette", "atmosphere", "environmental_elements", "subject1"],
        },
    },
    required: ["prompt", "details"],
};


const promptExamples = [
    {
      prompt: "You will perform an image edit using the people from the provided photos as the main subjects. Preserve their core likeness. Transform Subject 1 (male) and Subject 2 (female) into rival cyberpunk detectives in a neon-drenched alley. Rain slicks the ground, reflecting the holographic ads of the towering skyscrapers above. He's interrogating her, leaning against a graffiti-covered wall, while she remains defiant, a cybernetic glint in her eye.",
      details: {
        year: "2077",
        genre: "Cyberpunk Noir",
        location: "A narrow, rain-soaked alley between massive skyscrapers with glowing neon signs.",
        lighting: ["Harsh neon blues and pinks", "High-contrast shadows"],
        camera_angle: "Dutch angle medium shot, adding to the tension.",
        emotion: ["Tense", "Suspicious"],
        color_palette: ["Deep blues", "electric pink", "cyan", "black"],
        atmosphere: ["Gritty", "Futuristic", "Oppressive"],
        environmental_elements: "Steam rising from vents, rain hitting the pavement, flickering holographic signs.",
        subject1: {
          costume: "A worn, high-collar trench coat over tactical gear.",
          subject_expression: "A cynical scowl, eyes narrowed in suspicion.",
          subject_action: "Pressing a hand against the wall, cornering Subject 2."
        },
        subject2: {
          costume: "A sleek, armored jumpsuit with glowing circuitry.",
          subject_expression: "A defiant glare, chin held high.",
          subject_action: "Arms crossed, looking unimpressed by the interrogation."
        },
        negative_prompt: {
          exclude_visuals: ["daylight", "clean streets", "smiling", "nature"],
          exclude_styles: ["cartoon", "watercolor", "cute"],
          exclude_colors: ["pastel", "warm"],
          exclude_objects: ["animals"]
        }
      }
    },
    {
      prompt: "You will perform an image edit using the people from the provided photos as the main subjects. Preserve their core likeness. Depict Subject 1 (male) and Subject 2 (male) as grizzled Viking explorers who have just landed on a misty, unknown shore. Their longship is visible behind them in the surf. They stand side-by-side, gazing at the towering, pine-covered mountains ahead, their expressions a mix of awe and determination.",
      details: {
        year: "982 AD",
        genre: "Historical Realism / Viking Saga",
        location: "A rocky, mist-covered beach with a dense pine forest and mountains in the background.",
        lighting: ["Overcast morning light", "Soft, diffused light through the mist"],
        camera_angle: "Low-angle wide shot, making the landscape and subjects feel epic.",
        emotion: ["Awestruck", "Determined"],
        color_palette: ["Muted greens", "stone gray", "deep blues", "earthy browns"],
        atmosphere: ["Misty", "Untamed", "Epic", "Quiet"],
        environmental_elements: "Thick fog rolling in from the sea, waves crashing on the shore, a raven perched on a nearby rock.",
        subject1: {
          costume: "Heavy furs, leather armor, and a horned helmet.",
          subject_expression: "A determined, weather-beaten face, looking towards the mountains.",
          subject_action: "Leaning on a large, carved battle axe."
        },
        subject2: {
          costume: "Chainmail over a tunic, with a thick cloak.",
          subject_expression: "A curious and awestruck look, taking in the new world.",
          subject_action: "Holding a coiled rope over his shoulder, ready for the expedition."
        },
        negative_prompt: {
          exclude_visuals: ["sunshine", "modern technology", "paved roads", "tropical plants"],
          exclude_styles: ["anime", "pop art", "minimalist"]
        }
      }
    }
];


const getPromptGenerationContent = (
    gender1: Gender,
    gender2: Gender | null,
    quality: string,
    aspectRatio: string,
    style: ArtisticStyle,
    subject1Details?: Partial<SubjectSpecificDetails>,
    subject2Details?: Partial<SubjectSpecificDetails>,
    negativePromptOverrides?: NegativePrompt,
    cameraAngle?: string
): string => {
    const promptParts: string[] = [];
    
    let styleInstruction: string;
    let genreConstraint = '';
    switch (style) {
        case 'Cinematic Photorealism':
            styleInstruction = `For this request, you MUST generate a concept for an Ultra-Photorealistic, Movie-Quality image. The result must look exactly like a frame from a high-budget blockbuster movie (IMAX quality). Focus on perfect lighting, skin texture details, 8k resolution, and realistic physics.`;
            genreConstraint = `CRITICAL REQUIREMENT: The 'genre' field in the output JSON MUST be 'Cinematic Photorealism'. The 'prompt' description MUST include keywords like: 'photorealistic', '8k', 'cinematic lighting', 'highly detailed', 'shot on Arri Alexa', 'depth of field'.`;
            break;
        case 'Artistic':
            styleInstruction = `For this request, lean towards more stylized, artistic, and non-photorealistic concepts like paintings, sketches, anime, or abstract art. Be creative and unpredictable with the medium.`;
            break;
        case 'Realism':
            styleInstruction = `For this request, focus on photorealistic concepts that look like they could be real photographs, even if the subject matter is fantastical.`;
            break;
        default:
            // For any other specific style selected
            styleInstruction = `For this request, you will generate a concept based on a specific artistic style.`;
            genreConstraint = `CRITICAL REQUIREMENT: The 'genre' field in the output JSON MUST be '${style}'. This is not optional. The entire concept, including all details, must reflect the '${style}' artistic style.`;
            break;
    }

    let mainInstruction: string;
    if (gender2) {
        mainInstruction = `Your task is to generate a wildly creative photo edit concept involving two subjects: Subject 1 (${gender1}) and Subject 2 (${gender2}). Create a cohesive scene where they interact or coexist. The output MUST be a valid JSON object. ${styleInstruction}`;
    } else {
        mainInstruction = `Your task is to generate a wildly creative photo edit concept involving a single subject (${gender1}). The output MUST be a valid JSON object. ${styleInstruction}`;
    }
    promptParts.push(mainInstruction);

    if (genreConstraint) {
        promptParts.push(genreConstraint);
    }

    if (cameraAngle && cameraAngle !== 'None') {
        promptParts.push(`CRITICAL REQUIREMENT: The 'camera_angle' field in the output JSON MUST be exactly '${cameraAngle}'.`);
    }
    
    const hasDetails = (details?: Partial<SubjectSpecificDetails>): boolean => {
        if (!details) return false;
        return !!details.costume || !!details.subject_action || !!details.subject_expression;
    };

    if (hasDetails(subject1Details)) {
        const providedDetails: string[] = [];
        if (subject1Details?.costume) providedDetails.push(`costume must be exactly: '${subject1Details.costume}'`);
        if (subject1Details?.subject_expression) providedDetails.push(`expression must be exactly: '${subject1Details.subject_expression}'`);
        if (subject1Details?.subject_action) providedDetails.push(`action must be exactly: '${subject1Details.subject_action}'`);
        promptParts.push(`CRITICAL REQUIREMENT for Subject 1: You MUST use these specific details: ${providedDetails.join('; ')}. Fill in any missing details creatively but these are MANDATORY.`);
    }

    if (gender2 && hasDetails(subject2Details)) {
        const providedDetails: string[] = [];
        if (subject2Details?.costume) providedDetails.push(`costume must be exactly: '${subject2Details.costume}'`);
        if (subject2Details?.subject_expression) providedDetails.push(`expression must be exactly: '${subject2Details.subject_expression}'`);
        if (subject2Details?.subject_action) providedDetails.push(`action must be exactly: '${subject2Details.subject_action}'`);
        promptParts.push(`CRITICAL REQUIREMENT for Subject 2: You MUST use these specific details: ${providedDetails.join('; ')}. Fill in any missing details creatively but these are MANDATORY.`);
    }

    if (negativePromptOverrides) {
        const { exclude_visuals, exclude_styles, exclude_colors, exclude_objects } = negativePromptOverrides;
        const requirements: string[] = [];
        if (exclude_visuals && exclude_visuals.length > 0) requirements.push(`visuals: [${exclude_visuals.join(', ')}]`);
        if (exclude_styles && exclude_styles.length > 0) requirements.push(`styles: [${exclude_styles.join(', ')}]`);
        if (exclude_colors && exclude_colors.length > 0) requirements.push(`colors: [${exclude_colors.join(', ')}]`);
        if (exclude_objects && exclude_objects.length > 0) requirements.push(`objects: [${exclude_objects.join(', ')}]`);

        if (requirements.length > 0) {
            promptParts.push(`CRITICAL REQUIREMENT: The generated 'negative_prompt' MUST strictly include these specific exclusions: ${requirements.join('; ')}. You MUST incorporate these values into the respective arrays in the final JSON output. You may add other relevant exclusions as well.`);
        }
    }

    promptParts.push(`The concept you generate MUST be suitable for a ${quality === 'high' ? 'high-quality, highly detailed' : 'standard quality'} image. CRITICAL: The composition must strictly adhere to a cinematic ${aspectRatio} aspect ratio.`);

    const jsonStructure = {
      prompt: "A main instruction string that starts with 'You will perform an image edit...' followed by a summary of the concept.",
      details: {
        year: "e.g., 1985, Cyberpunk Future, Ancient Rome",
        genre: "e.g., Sci-Fi Noir, Charcoal Sketch, 80s Anime",
        location: "A vivid description of the setting.",
        lighting: ["A description of the lighting."],
        camera_angle: "A specific camera angle.",
        emotion: ["The dominant emotion of the scene."],
        color_palette: ["The key colors of the scene."],
        atmosphere: ["The overall mood and atmosphere."],
        environmental_elements: "Key dynamic or static elements.",
        subject1: {
          costume: "Subject 1's clothing and accessories.",
          subject_expression: "Subject 1's facial expression.",
          subject_action: "Subject 1's action."
        },
        subject2: { // This key should ONLY be included if the prompt is for two subjects.
          costume: "Subject 2's clothing and accessories.",
          subject_expression: "Subject 2's facial expression.",
          subject_action: "Subject 2's action."
        },
        negative_prompt: {
          exclude_visuals: ["Visuals to avoid"],
          exclude_styles: ["Styles to avoid"],
          exclude_colors: ["Colors to avoid (optional)"],
          exclude_objects: ["Specific objects to avoid (optional)"]
        }
      }
    };
    promptParts.push('The response MUST be a single, valid JSON object following this exact structure:');
    promptParts.push(JSON.stringify(jsonStructure, null, 2));
    promptParts.push("CRITICAL: The 'negative_prompt' object MUST be generated for EVERY concept. Tailor it to the specific concept. This is not optional.");
    if (gender2) {
        promptParts.push("CRITICAL: Because two subjects were requested, the final JSON object MUST include the `subject2` details object.");
    } else {
        promptParts.push("CRITICAL: Because only one subject was requested, the final JSON object must NOT include the `subject2` key.");
    }

    promptParts.push('\nHere are some examples. Do NOT copy their themes. Be original.');
    promptExamples.forEach((example, index) => {
        promptParts.push(`\nExample ${index + 1}:`);
        promptParts.push(JSON.stringify(example, null, 2));
    });

    promptParts.push(`\nCRITICAL INSTRUCTION: Now, generate a brand new concept. It MUST be completely different from the examples. Be unpredictable. Remember to generate specific, context-aware negative prompts. Generate the concept as a valid JSON object.`);

    return promptParts.join('\n');
};

export const generateEditPrompt = async (
    gender1: Gender,
    gender2: Gender | null,
    quality: string,
    aspectRatio: string,
    style: ArtisticStyle,
    textModel: TextModel,
    apiKey?: string | null,
    subject1Details?: Partial<SubjectSpecificDetails>,
    subject2Details?: Partial<SubjectSpecificDetails>,
    negativePromptOverrides?: NegativePrompt,
    cameraAngle?: string
): Promise<Prompt> => {
    const ai = getAiClient(apiKey);
    incrementApiUsage(!!apiKey); // Track API call
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: textModel,
        contents: getPromptGenerationContent(gender1, gender2, quality, aspectRatio, style, subject1Details, subject2Details, negativePromptOverrides, cameraAngle),
        config: {
            systemInstruction: "You are a creative director specializing in generating imaginative and cinematic photo edit concepts. You must output your response as a valid JSON object.",
            responseMimeType: "application/json",
            responseSchema: promptSchema,
        },
    }));

    try {
        let jsonText = response.text.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }
        const parsedJson = JSON.parse(jsonText);

        if (!parsedJson || typeof parsedJson.prompt !== 'string' || typeof parsedJson.details !== 'object' || !parsedJson.details.subject1) {
            console.error("Parsed JSON is missing required fields:", parsedJson);
            throw new Error("The AI returned a JSON object with an unexpected structure.");
        }
        
        // Ensure subject2 is either an object or not present, not null or something else.
        if (parsedJson.details.subject2 === null) {
            delete parsedJson.details.subject2;
        }

        return parsedJson as Prompt;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        const errorMessage = e instanceof Error ? e.message : "An unknown parsing error occurred.";
        throw new Error(`The AI returned an unexpected format. ${errorMessage}`);
    }
};

export const editImageWithGemini = async (
    imageData1: { base64: string, mimeType: string } | null,
    imageData2: { base64: string, mimeType: string } | null,
    prompt: Prompt,
    quality: string,
    aspectRatio: string,
    imageModel: ImageModel,
    apiKey?: string | null,
    removeBackground?: boolean,
): Promise<string> => {
    if (!imageData1) {
        throw new Error("The first image is required for editing.");
    }

    const ai = getAiClient(apiKey);
    incrementApiUsage(!!apiKey);

    const instructionParts = [];
    if (removeBackground) {
        instructionParts.push("First, perfectly remove the background from all subjects in the image, making it transparent. The subjects must be fully and cleanly isolated.");
    }

    // Determine if the style requested is photorealistic. 
    // If so, we must strictly preserve identity and avoid stylization.
    const isPhotorealistic = 
        prompt.details.genre === 'Cinematic Photorealism' || 
        prompt.details.genre === 'Realism' || 
        (prompt.details.genre && prompt.details.genre.includes('Photorealism'));

    if (imageData2) {
        instructionParts.push("ABSOLUTELY CRITICAL: This prompt involves two people. Use the person from the FIRST uploaded image as Subject 1, and the person from the SECOND uploaded image as Subject 2.");
        
        if (isPhotorealistic) {
             instructionParts.push("This is a PHOTOREALISTIC edit. You MUST PRESERVE the facial identity of Subject 1 and Subject 2 with 100% fidelity. Do NOT stylize their faces. Do NOT turn them into cartoons, paintings, or caricatures. Keep the skin texture and human likeness exactly as provided in the source photos. Integrate these REAL people into the cinematic scene using lighting and composition only.");
        } else {
             instructionParts.push("Your primary task is to STYLIZE their facial features to match the artistic style of the scene. The final result must have facial features with 100% identical likeness to the reference images, ensuring they are CLEARLY AND UNMISTAKABLY RECOGNIZABLE. Do not simply paste their faces. Instead, transform their unique features (eyes, nose, mouth, jawline) into the new style (e.g., if the style is 'caricature', render their faces as recognizable caricatures; if 'oil painting', render them in a painterly way). It is PARAMOUNT that the core likeness of BOTH individuals is preserved. Do not replace them with generic faces.");
        }
    } else {
        if (isPhotorealistic) {
             instructionParts.push("ABSOLUTELY CRITICAL: This is a PHOTOREALISTIC edit. You MUST PRESERVE the facial identity of the subject with 100% fidelity. Do NOT stylize their face. Do NOT turn them into a cartoon, painting, or caricature. Keep the skin texture and human likeness exactly as provided in the source photo. Integrate this REAL person into the cinematic scene using lighting and composition only.");
        } else {
             instructionParts.push("ABSOLUTELY CRITICAL: Your primary task is to STYLIZE the subject's facial features to match the artistic style of the scene. The final result must have facial features with 100% identical likeness to the reference image, ensuring they are CLEARLY AND UNMISTAKABLY RECOGNIZABLE. Do not simply paste their face. Instead, transform their unique features (eyes, nose, mouth, jawline) into the new style (e.g., if the style is 'caricature', render their face as a recognizable caricature; if 'oil painting', render it in a painterly way). It is PARAMOUNT that the core likeness of the individual is preserved. Do not replace them with a generic face.");
        }
    }
    
    instructionParts.push(`Now, apply the following creative edit: ${prompt.prompt}`);

    const { negative_prompt } = prompt.details;
    if (negative_prompt) {
        const allExclusions = [
            ...(negative_prompt.exclude_visuals || []),
            ...(negative_prompt.exclude_styles || []),
            ...(negative_prompt.exclude_colors || []),
            ...(negative_prompt.exclude_objects || [])
        ];
        if (allExclusions.length > 0) {
            instructionParts.push(`--- NEGATIVE PROMPT: Strictly avoid the following elements and styles: ${allExclusions.join(', ')}.`);
        }
    }
    
    let finalPrompt = `CRITICAL INSTRUCTION: ${instructionParts.join(' ')}`;

    if (quality === 'high') finalPrompt += ' The final image should be of high quality, with fine details and a professional finish.';
    if (aspectRatio && aspectRatio !== '1:1') finalPrompt += ` CRITICAL: The final image's composition MUST strictly adhere to a cinematic ${aspectRatio} aspect ratio.`;
    
    const contentParts = [];
    contentParts.push({
        inlineData: {
            data: imageData1.base64,
            mimeType: imageData1.mimeType,
        },
    });

    if (imageData2) {
        contentParts.push({
            inlineData: {
                data: imageData2.base64,
                mimeType: imageData2.mimeType,
            },
        });
    }

    contentParts.push({ text: finalPrompt });

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: imageModel,
        contents: { parts: contentParts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("No image was generated by the model.");
};
