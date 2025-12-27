import { pipeline, env } from '@xenova/transformers';

// Skip local model checks
env.allowLocalModels = false; 

const BACKUP_CAPTIONS = [
  "REALITY_.EXE HAS STOPPED WORKING",
  "POV: YOU DELETED SYSTEM32",
  "PLEASE DO NOT PERCEIVE ME",
  "NO THOUGHTS JUST STATIC",
  "ERROR 404: SOUL NOT FOUND",
  "IT LOOKS AT YOU FROM THE ABYSS",
  "AVERAGE TUESDAY IN OHIO"
];

class AI_Pipeline {
  static visionTask = null;
  static textTask = null;

  static async getInstance() {
    if (this.visionTask === null) {
      console.log('Loading Vision Model...');
      this.visionTask = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
    }
    if (this.textTask === null) {
      console.log('Loading Text Model (distilgpt2)...');
      // SWITCH: distilgpt2 is lighter (300MB) and very chaotic
      this.textTask = await pipeline('text-generation', 'Xenova/distilgpt2');
    }
    return { vision: this.visionTask, text: this.textTask };
  }
}

self.addEventListener('message', async (event) => {
  const { image, originalSrc } = event.data;

  try {
    self.postMessage({ status: 'loading', message: 'Analyzing pixels...' });
    const pipe = await AI_Pipeline.getInstance();

    // 1. Vision
    const visionResult = await pipe.vision(image);
    const description = visionResult[0].generated_text;
    console.log("Vision Output:", description); // DEBUG LOG
    
    self.postMessage({ status: 'update', message: `Seen: "${description}"` });

    // 2. Text Generation (Brainrot Mode)
    self.postMessage({ status: 'update', message: 'Hallucinating caption...' });

    // New Prompt Strategy for GPT-2: Start the sentence and let it ramble
    const prompt = `IMAGE ANALYSIS: ${description}. \nMEME CAPTION: WHEN YOU`;
    
    const textResult = await pipe.text(prompt, {
      max_new_tokens: 25,
      temperature: 0.9, // High chaos
      do_sample: true,  // Randomize
      top_k: 50,
    });

    console.log("Raw AI Output:", textResult); // DEBUG LOG

    // Cleanup: Remove the prompt from the result
    let rawText = textResult[0].generated_text;
    
    // Extract everything AFTER "MEME CAPTION:"
    let caption = rawText.split("MEME CAPTION:")[1] || rawText;
    caption = caption.trim();

    console.log("Cleaned Caption:", caption); // DEBUG LOG

    // Only use backup if caption is truly empty
    if (!caption || caption.length < 3) {
       console.log("Caption too short, using backup.");
       caption = BACKUP_CAPTIONS[Math.floor(Math.random() * BACKUP_CAPTIONS.length)];
    }

    self.postMessage({ 
      status: 'complete', 
      result: { 
        description, 
        caption,
        imageUsed: originalSrc || image // Send back the path so App.jsx knows what image to render
      } 
    });

  } catch (error) {
    console.error("WORKER ERROR:", error); // DEBUG LOG
    // This tells us if it crashed
    const panicCaption = BACKUP_CAPTIONS[Math.floor(Math.random() * BACKUP_CAPTIONS.length)];
    self.postMessage({ 
      status: 'complete', 
      result: { description: "Error", caption: panicCaption } 
    });
  }
});