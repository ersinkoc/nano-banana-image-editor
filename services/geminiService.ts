import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Prompt, ArtisticStyle } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT_GENERATION_MODEL = 'gemini-2.5-flash';
const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image';

// Fix: Added a responseSchema to enforce a JSON object structure for the response,
// improving reliability based on Gemini API best practices.
const promptSchema = {
    type: Type.OBJECT,
    properties: {
        prompt: { type: Type.STRING },
        details: {
            type: Type.OBJECT,
            properties: {
                year: { type: Type.STRING },
                genre: { type: Type.STRING },
                location: { type: Type.STRING },
                lighting: { type: Type.STRING },
                camera_angle: { type: Type.STRING },
                emotion: { type: Type.STRING },
                costume: { type: Type.STRING },
                color_palette: { type: Type.STRING },
                atmosphere: { type: Type.STRING },
                subject_expression: { type: Type.STRING },
                subject_action: { type: Type.STRING },
                environmental_elements: { type: Type.STRING },
            },
            required: ["year", "genre", "location", "lighting", "camera_angle", "emotion", "costume", "color_palette", "atmosphere", "subject_expression", "subject_action", "environmental_elements"],
        },
    },
    required: ["prompt", "details"],
};

const promptExamples = [
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Transform him into a lone wanderer standing on the cracked highway of a post-apocalyptic desert, with remnants of a fallen metropolis shimmering in the heat haze behind him. His coat flaps in the scorching wind, dust swirling around as he grips a weathered map and stares toward the burning horizon where the last remnants of civilization glow faintly under an orange sun.",
      details: {
        year: "2097",
        genre: "Post-Apocalyptic Drama",
        location: "Desert highway with crumbling city ruins in the distance",
        lighting: "Harsh golden sunset with intense desert glare and long shadows",
        camera_angle: "Low-angle wide shot emphasizing scale and isolation",
        emotion: "Stoic determination mixed with quiet melancholy",
        costume: "Tattered trench coat, dust mask, heavy boots, leather gloves",
        color_palette: "Burnt orange, ochre, sand beige, and deep rust tones",
        atmosphere: "Dry, desolate, cinematic — heavy with heat and memory",
        subject_expression: "A thousand-yard stare, focused and unwavering",
        subject_action: "Clutching a worn, folded map, bracing against the wind",
        environmental_elements: "Heat haze shimmering off the asphalt, dust devils swirling, a vulture circling high above"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Place the subject in a quiet, minimalist Scandinavian-style living room during a lazy afternoon. The atmosphere is calm and peaceful. The person is sitting in a comfortable armchair, reading a book, with soft light filtering in through a large window.",
      details: {
        year: "Present Day",
        genre: "Slice of Life / Photorealism",
        location: "A bright, airy living room with simple wooden furniture and a few plants.",
        lighting: "Soft, diffused afternoon sunlight streaming through a window, creating long, gentle shadows.",
        camera_angle: "Eye-level, medium shot, creating a natural and relatable perspective.",
        emotion: "Calm contentment and peacefulness.",
        costume: "Casual, comfortable clothing like a sweater and jeans.",
        color_palette: "Neutral and warm tones: whites, light grays, natural wood, and green from plants.",
        atmosphere: "Serene, quiet, and comfortable. A moment of peaceful solitude.",
        subject_expression: "A soft, peaceful smile of complete absorption",
        subject_action: "Holding a hardcover book, with a finger marking the page",
        environmental_elements: "Dust motes dancing in the sunbeam, steam gently rising from a nearby mug, a plant's shadow stretching across the floor"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Transform the subject into a character from a 1980s sci-fi anime film. The style should be reminiscent of classic hand-drawn cel animation, with sharp, expressive lines and a slightly grainy film texture. The character should be piloting a mech in a neon-lit city.",
      details: {
        year: "1988",
        genre: "80s Sci-Fi Anime / Mecha",
        location: "Cockpit of a giant robot, overlooking a futuristic city at night.",
        lighting: "Strong key light from holographic dashboard displays, casting blue and pink neon reflections.",
        camera_angle: "Medium close-up on the face, looking slightly off-camera.",
        emotion: "Focused intensity",
        costume: "High-tech pilot suit with a sleek helmet (optional).",
        color_palette: "Vibrant neons (cyan, magenta) against deep blues and purples.",
        atmosphere: "Nostalgic, analog sci-fi feel, with a sense of high-stakes action.",
        subject_expression: "Gritted teeth and narrowed eyes, focused on the holographic display",
        subject_action: "Hands gripping the mech's control sticks, knuckles white",
        environmental_elements: "Raindrops streaking across the cockpit's viewport, neon signs reflecting on wet surfaces, holographic data flickering"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Re-imagine the subject as a dramatic charcoal portrait sketch on textured paper. The focus should be on raw emotion and expressive mark-making, not perfect realism. The background should fade into abstract, smudged shadows.",
      details: {
        year: "Timeless",
        genre: "Expressive Portraiture / Charcoal Sketch",
        location: "Artist's studio (implied, not visible)",
        lighting: "Single, strong light source from the side (chiaroscuro effect), creating deep shadows.",
        camera_angle: "Straight-on, intimate close-up.",
        emotion: "Pensive and introspective.",
        costume: "Simple, dark clothing that blends into the shadows.",
        color_palette: "Monochromatic - rich blacks, varied grays, and the white of the paper.",
        atmosphere: "Raw, emotional, and artistic. The texture of the charcoal and paper should be almost tangible.",
        subject_expression: "A melancholic, downward gaze, lips slightly parted",
        subject_action: "Resting their chin on their hand, one shoulder slightly raised",
        environmental_elements: "Visible texture of the rough paper, smudged charcoal marks creating a soft vignette, stray eraser dust"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Cast the subject as a private detective in a 1930s Art Deco metropolis, caught in a moment of contemplation. Rain slicks the cobblestone streets, reflecting the neon signs of the city's underbelly. The subject leans against a grand, brass-adorned doorway, steam rising from a nearby sewer grate, their face half-shrouded in shadow.",
      details: {
        year: "1934",
        genre: "Art Deco Noir Film",
        location: "A rain-swept city street at night, with towering, geometric skyscrapers in the background.",
        lighting: "High-contrast chiaroscuro, with a single key light from a streetlamp and deep, dramatic shadows.",
        camera_angle: "Slight low-angle shot, looking up at the subject to give them an imposing presence.",
        emotion: "Weary, contemplative, and suspicious.",
        costume: "Classic film noir attire: a fedora pulled low and a belted trench coat with the collar turned up.",
        color_palette: "Mostly monochromatic with selective pops of color from neon signs (e.g., deep blues, blacks, and electric reds).",
        atmosphere: "Gritty, mysterious, and rain-soaked, with a sense of underlying danger.",
        subject_expression: "A cynical smirk, eyes scanning the street from under the brim of a fedora",
        subject_action: "Lighting a cigarette, cupping his hands against the wind",
        environmental_elements: "Steam rising from a manhole cover, rain forming puddles that reflect neon signs, a distant siren"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Reimagine the subject as a whimsical character in a children's storybook illustration. They are a friendly badger botanist, meticulously tending to glowing, fantastical plants in a cozy, cluttered greenhouse made of reclaimed wood and glass. The style should be soft watercolor with visible paper texture and gentle ink outlines.",
      details: {
        year: "Timeless Storybook",
        genre: "Children's Book Watercolor",
        location: "A warm, cluttered greenhouse filled with magical, glowing flora.",
        lighting: "Soft, diffused light filtering through the glass panes, creating a gentle, warm glow.",
        camera_angle: "Eye-level, intimate shot that feels welcoming and cozy.",
        emotion: "Joyful concentration and gentle curiosity.",
        costume: "A tweed waistcoat over a simple shirt, with small, round spectacles perched on their nose.",
        color_palette: "Earthy tones of browns and greens, accented by the soft, luminous colors of the magical plants.",
        atmosphere: "Charming, cozy, and full of whimsical wonder.",
        subject_expression: "A look of delight and careful focus",
        subject_action: "Gently misting a glowing mushroom with a tiny spray bottle",
        environmental_elements: "Sunbeams filtering through dusty glass, overgrown vines snaking around pots, fireflies hovering near glowing plants"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Transform the subject into a stylized, low-poly 3D character. They are an explorer standing on the edge of a vibrant, geometric alien world. The landscape is composed of colorful, faceted crystals and floating islands, rendered with flat shading and no textures. The aesthetic should feel clean, minimalist, and digital.",
      details: {
        year: "Conceptual Future",
        genre: "Low-Poly 3D Art",
        location: "The crystalline edge of a minimalist alien planet.",
        lighting: "Simple, directional lighting that creates distinct, hard-edged shadows, emphasizing the geometric forms.",
        camera_angle: "Dramatic wide shot to showcase the expansive, abstract landscape.",
        emotion: "A sense of awe and discovery.",
        costume: "A simple, angular space suit with a helmet that shows the face clearly.",
        color_palette: "A bright, high-contrast palette, like turquoise, magenta, and orange against a dark purple sky.",
        atmosphere: "Serene, digital, and otherworldly.",
        subject_expression: "Wide-eyed wonder, mouth slightly agape",
        subject_action: "Reaching a hand out towards a floating crystal",
        environmental_elements: "Geometric islands drifting slowly, crystalline structures pulsing with soft light, a sky with two blocky moons"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Position the subject as a brilliant inventor in a Victorian-era workshop filled with brass machinery, intricate clockwork, and glowing vacuum tubes. They are tinkering with a complex automaton, with detailed blueprints scattered across a wooden workbench. The air is thick with the smell of oil and ozone.",
      details: {
        year: "1888",
        genre: "Steampunk Inventor",
        location: "A cluttered, high-ceiling workshop with exposed pipes and gears.",
        lighting: "Warm, atmospheric light from gas lamps and the soft glow of aetheric devices, creating long, dramatic shadows.",
        camera_angle: "Medium shot, focused on the subject's hands-on work with their invention.",
        emotion: "Intense focus and a spark of genius.",
        costume: "Leather apron over a waistcoat and shirt with rolled-up sleeves, perhaps with brass goggles pushed up on their forehead.",
        color_palette: "Rich browns, deep brass, and warm copper tones, with accents of electric blue from the machinery.",
        atmosphere: "Intellectual, industrious, and anachronistically technological.",
        subject_expression: "A focused frown of concentration, occasionally breaking into a grin of discovery",
        subject_action: "Using a delicate pair of pliers to adjust a tiny gear on an automaton's hand",
        environmental_elements: "Sparks flying from a nearby device, blueprints curling at the edges, bubbling liquids in glass beakers"
      }
    },
    {
      prompt: "You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered. Render the image as an authentic 19th-century daguerreotype photograph. The subject should have a formal, stoic pose, looking directly at the camera. The image should have the characteristic silver-on-copper sheen, slight chemical imperfections, and a shallow depth of field. The background is a simple, plain studio backdrop.",
      details: {
        year: "1850s",
        genre: "Daguerreotype Portrait",
        location: "An early photography studio.",
        lighting: "Simple, direct lighting from a single source, typical of the era's photographic techniques, creating subtle contrast.",
        camera_angle: "Straight-on portrait, chest-up.",
        emotion: "Serious, stoic, and neutral, as was common for long-exposure portraits.",
        costume: "Formal attire from the mid-19th century, like a high-collared dress or a formal suit with a cravat.",
        color_palette: "Monochromatic with a metallic, silvery tint. No true blacks, but rather deep, reflective grays.",
        atmosphere: "Historic, formal, and hauntingly still. A preserved moment from the past.",
        subject_expression: "A completely neutral, unwavering gaze, as required for long exposures",
        subject_action: "Sitting perfectly still, hands folded in their lap",
        environmental_elements: "Slight chemical tarnishing at the edges of the plate, a subtle reflection of the studio window in the subject's eyes"
      }
    }
];


const getPromptGenerationContent = (gender: string, quality: string, aspectRatio: string, style: ArtisticStyle): string => {
    const promptParts: string[] = [];

    // Part 1: Main Task
    let styleInstruction: string;
    switch (style) {
        case 'Impressionistic':
            styleInstruction = `For this request, lean towards an Impressionistic style. Think visible brushstrokes, emphasis on light and its changing qualities, and ordinary subject matter. Like a painting by Monet or Renoir.`;
            break;
        case 'Surrealist':
            styleInstruction = `For this request, lean towards a Surrealist style. Create dream-like, bizarre, and illogical scenes. Think of the works of Salvador Dalí or Max Ernst.`;
            break;
        case 'Art Nouveau':
            styleInstruction = `For this request, lean towards an Art Nouveau style. Use long, sinuous, organic lines, floral and plant-inspired motifs, and a decorative, ornamental quality. Think Alphonse Mucha.`;
            break;
        case 'Cubist':
            styleInstruction = `For this request, lean towards a Cubist style. The subject should be analyzed, broken up, and reassembled in an abstracted form—depicting the subject from a multitude of viewpoints. Think Picasso or Braque.`;
            break;
        case 'Pixel Art':
            styleInstruction = `For this request, lean towards a retro Pixel Art style. The concept should be suitable for a 16-bit or 32-bit video game, with clear pixel clusters and a limited color palette.`;
            break;
        case 'Synthwave':
            styleInstruction = `For this request, lean towards a Synthwave style. Think 1980s retrofuturism, neon grids, vibrant pinks and blues, and a nostalgic, electronic feel.`;
            break;
        case 'Steampunk':
            styleInstruction = `For this request, lean towards a Steampunk style. Combine Victorian-era aesthetics with industrial, steam-powered machinery. Think brass, gears, and intricate clockwork.`;
            break;
        case 'Vintage Photo':
            styleInstruction = `For this request, lean towards a vintage photography style. Emulate the look of old film, daguerreotypes, or sepia-toned prints from a specific historical era.`;
            break;
        case 'Line Art':
            styleInstruction = `For this request, lean towards a minimalist Line Art style. The image should be composed of clean, simple lines with minimal shading or color, focusing on form and shape.`;
            break;
        case 'Artistic':
            styleInstruction = `For this request, lean towards more stylized, artistic, and non-photorealistic concepts like paintings, sketches, anime, or abstract art. Be creative and unpredictable with the medium.`;
            break;
        case 'Realistic':
        default:
            styleInstruction = `For this request, focus on photorealistic concepts that look like they could be real photographs, even if the subject matter is fantastical.`;
            break;
    }
    
    let mainInstruction = `Your task is to generate a wildly creative and random photo edit concept. The output MUST be a valid JSON object. There are absolutely no limits to your imagination. You can generate concepts ranging from photorealistic scenes to abstract art, from cinematic epics to simple charcoal sketches, from cartoons to oil paintings. Be unpredictable. ${styleInstruction}`;
    
    mainInstruction += ` Create a full, random concept for a ${gender} subject.`;
    promptParts.push(mainInstruction);
    
    promptParts.push(`The concept you generate MUST be suitable for a ${quality === 'high' ? 'high-quality, highly detailed' : 'standard quality'} image. CRITICAL: The composition must strictly adhere to a cinematic ${aspectRatio} aspect ratio. Take this into account when designing the scene (e.g., 16:9 is wide and cinematic, 9:16 is tall and good for portraits). This is a strict requirement.`);

    // Part 2: JSON structure instructions
    const jsonStructure = {
      prompt: "A main instruction string that starts with 'You will perform an image edit using the person from the provided photo as the main subject. The face must remain clear and unaltered.' followed by a summary of the concept.",
      details: {
        year: "A specific year or era (e.g., 1985, Cyberpunk Future, Ancient Rome)",
        genre: "A specific genre, style, or artistic medium (e.g., Sci-Fi Noir, Charcoal Sketch, 80s Anime)",
        location: "A vivid description of the setting.",
        lighting: "A description of the lighting.",
        camera_angle: "A specific camera angle.",
        emotion: "The dominant emotion of the scene.",
        costume: "A description of the subject's clothing and accessories.",
        color_palette: "The key colors of the scene.",
        atmosphere: "A rich, evocative description of the overall mood and atmosphere.",
        subject_expression: "A specific facial expression for the subject (e.g., 'a knowing smirk', 'serene contemplation').",
        subject_action: "A specific, subtle action the subject is performing (e.g., 'adjusting a cufflink', 'gazing at a pocket watch').",
        environmental_elements: "Key dynamic or static elements in the environment (e.g., 'falling snow, swirling fog, lens flare')."
      }
    };
    promptParts.push('The response MUST be a single, valid JSON object following this exact structure:');
    promptParts.push(JSON.stringify(jsonStructure, null, 2));

    // Part 3: Examples
    promptParts.push('\nHere are some examples to show the desired output format and quality. Do NOT copy their themes. Be original and explore different styles.');
    promptExamples.forEach((example, index) => {
        promptParts.push(`\nExample ${index + 1}:`);
        promptParts.push(JSON.stringify(example, null, 2));
    });

    // Part 4: Final instruction
    promptParts.push(`\nCRITICAL INSTRUCTION: Now, generate a brand new concept. It MUST be completely different in theme, style, artistic medium, and subject matter from all the examples provided. Your goal is maximum randomness and creativity. It could be a simple scene, a cartoon, a painting, a sketch, or a cinematic shot. Be unpredictable. The only rule is to preserve the subject's facial features. Generate the concept as a valid JSON object.`);

    return promptParts.join('\n');
};

export const generateEditPrompt = async (
    gender: string,
    quality: string = 'standard',
    aspectRatio: string = '1:1',
    style: ArtisticStyle = 'Realistic'
): Promise<Prompt> => {
    const response = await ai.models.generateContent({
        model: PROMPT_GENERATION_MODEL,
        contents: getPromptGenerationContent(gender, quality, aspectRatio, style),
        config: {
            systemInstruction: "You are a creative director specializing in generating imaginative and cinematic photo edit concepts across all artistic styles. You must output your response as a valid JSON object.",
            responseMimeType: "application/json",
            // Fix: Added responseSchema to ensure the model returns a valid JSON object.
            responseSchema: promptSchema,
        },
    });

    try {
        let jsonText = response.text.trim();
        // The model might wrap the JSON in markdown fences. We need to remove them for robust parsing.
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }
        const parsedJson = JSON.parse(jsonText);

        // Enhancement: Add validation to ensure the parsed object has the expected structure.
        // This makes the function more resilient to unexpected model outputs.
        if (!parsedJson || typeof parsedJson.prompt !== 'string' || typeof parsedJson.details !== 'object' ||
            !parsedJson.details.genre || !parsedJson.details.subject_action || !parsedJson.details.location) {
            console.error("Parsed JSON is missing required fields:", parsedJson);
            throw new Error("The AI returned a JSON object with an unexpected structure.");
        }

        return parsedJson as Prompt;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        // Consolidate error message for better debugging.
        const errorMessage = e instanceof Error ? e.message : "An unknown parsing error occurred.";
        throw new Error(`The AI returned an unexpected format. ${errorMessage}`);
    }
};

export const editImageWithGemini = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string,
    quality: string = 'standard',
    aspectRatio: string = '1:1'
): Promise<string> => {
    let finalPrompt = `CRITICAL INSTRUCTION: Preserve the core facial features (eyes, nose, mouth, jawline) of the person in the image. They must remain recognizable. You can creatively change hair style and color, add accessories like hats or glasses, and alter skin coloring to fit the new theme. Do not change the fundamental facial structure. Now, apply the following creative edit: ${prompt}`;

    if (quality === 'high') {
        finalPrompt += ' The final image should be of high quality, with fine details, sharp focus, and a professional, photorealistic finish.';
    }
    if (aspectRatio && aspectRatio !== '1:1') {
        finalPrompt += ` CRITICAL: The final image's composition MUST strictly adhere to a cinematic ${aspectRatio} aspect ratio.`;
    }

    const response = await ai.models.generateContent({
        model: IMAGE_EDIT_MODEL,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: finalPrompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("No image was generated by the model.");
};