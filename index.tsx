
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
    const [uploadedImageForDisplay, setUploadedImageForDisplay] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Raw base64
    const [imageMimeType, setImageMimeType] = useState<string>('');
    const [environment, setEnvironment] = useState<string>('a beach');
    const [style, setStyle] = useState<string>('photorealistic');
    const [outfitType, setOutfitType] = useState<'predefined' | 'custom'>('predefined');
    const [predefinedOutfit, setPredefinedOutfit] = useState<string>('casual wear');
    const [customOutfit, setCustomOutfit] = useState<string>('');
    const [pose, setPose] = useState<string>('sitting on a chair');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setUploadedImageForDisplay(result);
            setUploadedImage(result.split(',')[1]);
            setImageMimeType(file.type);
            setError(null);
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
        }
        // FIX: Corrected typo from readDataURL to readAsDataURL.
        reader.readAsDataURL(file);
    };

    const getStylePromptFragment = (selectedStyle: string): string => {
        switch (selectedStyle) {
            case 'fantasy-art':
                return 'A fantasy art style digital painting';
            case 'cyberpunk':
                return 'An image in a cyberpunk style with neon lighting and futuristic elements';
            case 'watercolor':
                return 'A watercolor painting';
            case 'anime':
                return 'An anime style image';
            case 'cartoon':
                return 'A cartoon style image';
            case 'photorealistic':
            default:
                return 'A photorealistic image';
        }
    }

    const handleGenerate = async () => {
        if (!uploadedImage) {
            setError('Please upload a character image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const outfitDescription = outfitType === 'predefined' ? predefinedOutfit : (customOutfit.trim() || 'appropriate clothing');
            const styleDescription = getStylePromptFragment(style);
            const fullPrompt = `${styleDescription} of the person from the provided photo, in the setting of ${environment}. The person is wearing ${outfitDescription} and is ${pose}. Maintain the person's identity and features from the original photo.`;
            
            const imagePart = {
                inlineData: {
                    data: uploadedImage,
                    mimeType: imageMimeType,
                },
            };
    
            const textPart = {
                text: fullPrompt,
            };
    
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [imagePart, textPart],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            let foundImage = false;
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                        setGeneratedImage(imageUrl);
                        foundImage = true;
                        break;
                    }
                }
            }

            if (!foundImage) {
                 setError("The AI didn't return an image. Please try a different prompt or image.");
            }

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>AI Character Generator</h1>
                <p>Create a consistent character and place them in any scenario you can imagine.</p>
            </header>
            
            <main className="main-content">
                <div className="controls-panel">
                    <div className="control-group">
                        <label htmlFor="image-upload">1. Upload Character Image</label>
                        <div className="image-preview" role="figure" aria-label="Uploaded character preview">
                            {uploadedImageForDisplay ? (
                                <img src={uploadedImageForDisplay} alt="Uploaded character" />
                            ) : (
                                <p className="placeholder-text">Your character image will appear here</p>
                            )}
                        </div>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageUpload}
                        />
                         <label htmlFor="image-upload" className="upload-button" style={{marginTop: '1rem', cursor: 'pointer'}}>
                            Select Image
                        </label>
                    </div>

                    <div className="control-group">
                        <label htmlFor="environment-select">2. Choose an Environment</label>
                        <select id="environment-select" value={environment} onChange={e => setEnvironment(e.target.value)}>
                            <option value="a beach">Beach</option>
                            <option value="a dense forest">Forest</option>
                            <option value="a bustling city street">City</option>
                            <option value="a futuristic sci-fi world">Futuristic Sci-Fi World</option>
                            <option value="a medieval castle">Medieval Castle</option>
                            <option value="a modern office">Office</option>
                            <option value="a tranquil Japanese garden">Japanese Garden</option>
                            <option value="a volcanic landscape">Volcanic Landscape</option>
                            <option value="an underwater scene">Underwater Scene</option>
                            <option value="a bustling market">Bustling Market</option>
                            <option value="a cozy cafe">Cozy Cafe</option>
                            <option value="a bustling spaceport">Bustling Spaceport</option>
                            <option value="a serene mountaintop">Serene Mountaintop</option>
                            <option value="a haunted mansion">Haunted Mansion</option>
                            <option value="a vibrant underwater city">Vibrant Underwater City</option>
                        </select>
                    </div>
                    
                    <div className="control-group">
                        <label htmlFor="style-select">3. Select an Artistic Style</label>
                        <select id="style-select" value={style} onChange={e => setStyle(e.target.value)}>
                            <option value="photorealistic">Photorealistic</option>
                            <option value="fantasy-art">Fantasy Art</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="watercolor">Watercolor</option>
                            <option value="anime">Anime</option>
                            <option value="cartoon">Cartoon</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>4. Customize Outfit</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="outfitType"
                                    value="predefined"
                                    checked={outfitType === 'predefined'}
                                    onChange={() => setOutfitType('predefined')}
                                />
                                Predefined
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="outfitType"
                                    value="custom"
                                    checked={outfitType === 'custom'}
                                    onChange={() => setOutfitType('custom')}
                                />
                                Custom
                            </label>
                        </div>
                        {outfitType === 'predefined' ? (
                            <select id="outfit-select" value={predefinedOutfit} onChange={e => setPredefinedOutfit(e.target.value)}>
                                <option value="casual wear">Casual</option>
                                <option value="a formal suit">Formal</option>
                                <option value="sportswear">Sportswear</option>
                                <option value="sci-fi armor">Sci-fi Armor</option>
                                <option value="a medieval knight outfit">Medieval Knight</option>
                                <option value="royal attire">Royal Attire</option>
                                <option value="pirate costume">Pirate Costume</option>
                                <option value="futuristic uniform">Futuristic Uniform</option>
                            </select>
                        ) : (
                             <textarea
                                id="custom-outfit-input"
                                value={customOutfit}
                                onChange={(e) => setCustomOutfit(e.target.value)}
                                placeholder="e.g., 'a vibrant red dress with gold embroidery'"
                            />
                        )}
                    </div>
                    
                    <div className="control-group">
                        <label htmlFor="pose-input">5. Describe Pose</label>
                        <textarea
                            id="pose-input"
                            value={pose}
                            onChange={(e) => setPose(e.target.value)}
                            placeholder="e.g., 'running', 'sitting on a chair', 'looking at the sunset'"
                        />
                    </div>
                    
                    <button onClick={handleGenerate} disabled={isLoading || !uploadedImage}>
                        {isLoading ? 'Generating...' : 'Generate Character'}
                    </button>
                    
                </div>
                
                <div className="output-panel">
                    <label>Generated Character</label>
                    <div className="output-image-container" aria-live="polite">
                       {isLoading && <div className="loader" aria-label="Loading..."></div>}
                       {error && <p className="error-message">{error}</p>}
                       {!isLoading && !error && generatedImage && (
                            <img src={generatedImage} alt="Generated AI character" />
                       )}
                       {!isLoading && !error && !generatedImage && (
                           <p className="placeholder-text">Your generated character will appear here</p>
                       )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
