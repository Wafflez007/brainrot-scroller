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
    console.log("Vision Output:", description); 
    
    self.postMessage({ status: 'update', message: 'Hallucinating caption...' });

    // FIX 1: "Few-Shot" Prompting
    // We give it examples so it knows exactly what style we want.
    // We end with "CAPTION: WHEN" to force it to start a "When you..." joke.
    const prompt = `
    Image: A cat screaming.
    Caption: WHEN YOU STEP ON A LEGO
    
    Image: A dark hallway.
    Caption: POV YOU FORGOT YOUR PHONE

    Image: ${description}.
    Caption: WHEN`;
    
    const textResult = await pipe.text(prompt, {
      max_new_tokens: 20,       // Keep it very short
      temperature: 1.1,         // Higher creativity to avoid boring text
      do_sample: true,
      top_k: 50,
      repetition_penalty: 1.2,  // Stop repeating words
      no_repeat_ngram_size: 2
    });

    console.log("Raw AI Output:", textResult); 

    // FIX 2: Cleanup Logic
    // The model will generate " WHEN..." so we need to add the "WHEN" back
    let rawText = textResult[0].generated_text;
    
    // Extract the new text added after our prompt
    let generatedPart = rawText.split(prompt)[1] || "";
    
    // Reconstruct the full caption
    let caption = ("WHEN " + generatedPart).trim();
    
    // Stop at the first newline or punctuation to prevent run-on paragraphs
    caption = caption.split('\n')[0];
    caption = caption.split('.')[0]; 

    // Remove common garbage characters
    caption = caption.replace(/[:"']/g, '').toUpperCase();

    console.log("Cleaned Caption:", caption); 

    // Fallback if it failed to generate anything meaningful
    if (caption.length < 5) {
       caption = BACKUP_CAPTIONS[Math.floor(Math.random() * BACKUP_CAPTIONS.length)];
    }

    self.postMessage({ 
      status: 'complete', 
      result: { 
        description, 
        caption,
        imageUsed: originalSrc || image 
      } 
    });

  } catch (error) {
    console.error("WORKER ERROR:", error);
    const panicCaption = BACKUP_CAPTIONS[Math.floor(Math.random() * BACKUP_CAPTIONS.length)];
    self.postMessage({ 
      status: 'complete', 
      result: { description: "Error", caption: panicCaption } 
    });
  }
});