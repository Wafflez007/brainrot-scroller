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

const CAPTION_STYLES = [
  "WHEN YOU REALIZE", 
  "POV YOU JUST",
  "ME AFTER",
  "NOBODY:",
  "THIS IMAGE FEELS LIKE",
  "LIVE REACTION TO",
  "BRO REALLY SAID",
  "TEACHER:",
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

    // 2. Select a Random Style
    const style = CAPTION_STYLES[Math.floor(Math.random() * CAPTION_STYLES.length)];

    // 3. Construct Prompt (Cleaned up whitespace)
    // We remove the indentation so the model doesn't get confused by spaces
    const prompt = `Image: A cat screaming.
Caption: WHEN YOU STEP ON A LEGO

Image: A dark hallway.
Caption: POV YOU FORGOT YOUR PHONE

Image: ${description}.
Caption: ${style}`;
    
    // 4. Generate Text
    const textResult = await pipe.text(prompt, {
      max_new_tokens: 25,       // Slightly increased to allow finishing the joke
      temperature: 1.1,         // High chaos
      do_sample: true,
      top_k: 50,
      repetition_penalty: 1.2,  
      no_repeat_ngram_size: 2
    });

    console.log("Raw AI Output:", textResult); 

    // 5. Cleanup Logic
    let rawText = textResult[0].generated_text;
    
    // Remove the prompt from the result to get ONLY the new words
    let generatedPart = rawText.replace(prompt, '').trim();
    
    // Combine Style + New Words
    let caption = `${style} ${generatedPart}`;
    
    // Clean it up (Stop at new lines, remove weird symbols)
    caption = caption.split('\n')[0];
    caption = caption.split('.')[0]; 
    caption = caption.replace(/[:"']/g, '').toUpperCase();

    // Remove double spaces if any
    caption = caption.replace(/\s+/g, ' ').trim();

    console.log("Cleaned Caption:", caption); 

    // Fallback
    if (caption.length < 5 || caption === style) {
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