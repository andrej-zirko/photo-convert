'use client'; // This directive indicates a client component

import React, { useState, useRef, useCallback, useEffect, ChangeEvent, DragEvent } from 'react';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (or delay changes)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}

// Interface for processed dimensions
interface ProcessedDimensions {
    width: number;
    height: number;
}

const ImageProcessor: React.FC = () => {
  // State variables
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null); // Store the original image data
  const [processedImageBase64, setProcessedImageBase64] = useState<string | null>(null); // Renamed for clarity
  const [base64Length, setBase64Length] = useState<number>(0);
  const [settings, setSettings] = useState({ quality: 0.8, maxWidth: 800, maxHeight: 600 });
  // ADDED: State for actual processed dimensions
  const [processedDimensions, setProcessedDimensions] = useState<ProcessedDimensions | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false); // For drag-and-drop UI feedback

  // Ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (sourceBase64: string, currentQuality: number, currentMaxWidth: number, currentMaxHeight: number) => {
    if (!sourceBase64) return; // Don't process if no source

    setProcessing(true);
    setError(null); // Clear previous errors during processing
    setProcessedDimensions(null); // Reset dimensions on new processing attempt

    return new Promise<void>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setError('Could not get canvas context.');
          setProcessing(false);
          reject(new Error('Could not get canvas context.'));
          return;
        }

        let { width, height } = img;
        const aspectRatio = width / height;

        // Calculate new dimensions while maintaining aspect ratio
        let targetWidth = width;
        let targetHeight = height;

        if (targetWidth > currentMaxWidth) {
            targetWidth = currentMaxWidth;
            targetHeight = targetWidth / aspectRatio;
        }
        // Check height constraint *after* potentially resizing for width
        if (targetHeight > currentMaxHeight) {
            targetHeight = currentMaxHeight;
            targetWidth = targetHeight * aspectRatio;
        }

        // Ensure dimensions are at least 1px and integers
        const finalWidth = Math.max(1, Math.round(targetWidth));
        const finalHeight = Math.max(1, Math.round(targetHeight));

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // --- UPDATE STATE ---
        // Store the actual final dimensions
        setProcessedDimensions({ width: finalWidth, height: finalHeight });
        // --- END UPDATE ---

        // Draw the resized image onto the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get the Base64 string with specified quality
        try {
          const processedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
          setProcessedImageBase64(processedBase64);
          setBase64Length(processedBase64.length);
          setError(null); // Clear error on success
        } catch (e) {
          console.error("Error generating Base64 string:", e);
          const errorMessage = `Error processing image: ${e instanceof Error ? e.message : String(e)}`;
          setError(errorMessage);
          setProcessedImageBase64(null);
          setProcessedDimensions(null); // Reset dimensions on error
          setBase64Length(0);
          reject(new Error(errorMessage));
        } finally {
          setProcessing(false); // Indicate processing finished
          resolve();
        }
      };

      img.onerror = () => {
        const errorMessage = 'Failed to load the image data for processing.';
        setError(errorMessage);
        setProcessedImageBase64(null);
        setProcessedDimensions(null); // Reset dimensions on error
        setBase64Length(0);
        setProcessing(false);
        reject(new Error(errorMessage));
      };

      // Set the source for the image object
      img.src = sourceBase64;
    });

  }, []); // Empty dependency array for the processing function itself

  // Debounce settings changes to avoid processing on every tiny adjustment
  const debouncedSettings = useDebounce(settings, 500); // 500ms delay

  // --- Effect to re-process when settings or original image change ---
  useEffect(() => {
    if (originalImageBase64) {
      processImage(originalImageBase64, debouncedSettings.quality, debouncedSettings.maxWidth, debouncedSettings.maxHeight)
        .catch(err => {
          console.error("Processing failed in useEffect:", err);
          // Error state is handled within processImage
        });
    }
     // No cleanup needed in this specific effect
  }, [originalImageBase64, debouncedSettings, processImage]); // Depend on debounced settings

  // --- Core logic to handle a File object ---
  const handleFile = useCallback((file: File | null) => {
    // Reset previous results immediately on new file selection attempt
    setOriginalImageBase64(null);
    setProcessedImageBase64(null);
    setBase64Length(0);
    setOriginalFileName('');
    setError(null);
    setProcessedDimensions(null); // Reset dimensions when new file selected

    if (!file) {
      // No file selected or selection cancelled
      return;
    }

    // Basic check for JPG/JPEG
    if (!file.type.match(/^image\/jpe?g$/i)) { // More robust check for jpg/jpeg
      setError('Please select or drop a JPG/JPEG image file.');
      // Reset file input visually if it was used
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setOriginalFileName(file.name);
    setProcessing(true); // Show processing indicator while reading file

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        // Store the original base64 string.
        // The useEffect will trigger the *initial* processing.
        setOriginalImageBase64(loadEvent.target.result);
        // Note: setProcessing(false) will happen inside the useEffect's processImage call
      } else {
        setError('Failed to read file content.');
        setProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file.');
      setProcessing(false);
    }

    // Read the file as a Data URL (Base64)
    reader.readAsDataURL(file);
  }, []); // No dependencies needed for this core file handler logic itself

  // --- Handle file selection via Input ---
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
  }, [handleFile]); // Depends on handleFile

  // --- Handle Settings Change ---
  const handleSettingChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;

    if (type === 'number' || name === 'quality' || name === 'maxWidth' || name === 'maxHeight') {
      processedValue = name === 'quality' ? parseFloat(value) : Math.max(1, parseInt(value, 10) || 1);
    }

    setSettings(prev => ({ ...prev, [name]: processedValue }));
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow drop
    event.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0] ?? null; // Get the first dropped file
    handleFile(file);
  }, [handleFile]); // Depends on handleFile

  // --- Render ---
  return (
    <div
      className={`container mx-auto p-4 max-w-2xl transition-all duration-200 ${isDraggingOver ? 'outline outline-4 outline-offset-4 outline-primary rounded-lg' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 className="text-3xl font-bold mb-6 text-center">Image Compressor, Resizer & Base64 Encoder</h1>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-base-200">
        {/* Max Width */}
        <div className="form-control">
          <label className="label" htmlFor="maxWidthInput">
            <span className="label-text font-semibold">Max Width (px)</span>
          </label>
          <input
            name="maxWidth"
            id="maxWidthInput"
            type="number"
            value={settings.maxWidth}
            onChange={handleSettingChange} // Update intermediate state
            className={`input input-bordered w-full ${processing ? 'input-disabled' : ''}`}
            min="1"
            disabled={processing} // Disable inputs while processing
          />
        </div>

        {/* Max Height */}
        <div className="form-control">
          <label className="label" htmlFor="maxHeightInput">
            <span className="label-text font-semibold">Max Height (px)</span>
          </label>
          <input
            name="maxHeight"
            id="maxHeightInput"
            type="number"
            value={settings.maxHeight}
            onChange={handleSettingChange} // Update intermediate state
            className={`input input-bordered w-full ${processing ? 'input-disabled' : ''}`}
            min="1"
            disabled={processing} // Disable inputs while processing
          />
        </div>

        {/* Quality Slider */}
        <div className="form-control">
           <label className="label" htmlFor="qualitySlider">
            <span className="label-text font-semibold">Quality ({settings.quality.toFixed(2)})</span>
          </label>
          <input
            name="quality"
            id="qualitySlider"
            type="range"
            min="0.1" // Avoid 0 quality which might not be valid
            max="1"
            step="0.05"
            value={settings.quality}
            onChange={handleSettingChange} // Update intermediate state
            className="range range-primary"
            disabled={processing} // Disable inputs while processing
          />
        </div>
      </div>

      {/* File Input */}
      <div className="form-control mb-6">
         <label className="label" htmlFor="imageInput">
            <span className="label-text font-semibold">Select or Drop JPG/JPEG Image:</span>
          </label>
        <input
          ref={fileInputRef}
          id="imageInput"
          type="file"
          accept="image/jpeg,image/jpg" // Accept only JPG/JPEG
          onChange={handleFileChange}
          // Make clicking the label focus the input for better UX with drag/drop area
          onClick={() => fileInputRef.current?.click()}
          className="file-input file-input-bordered file-input-primary w-full"
          disabled={processing} // Disable while processing/reading
        />
      </div>

      {/* Loading Indicator */}
      {processing && (
        <div className="text-center my-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p>Processing image...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div role="alert" className="alert alert-error my-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Error: {error}</span>
        </div>
      )}

      {/* Results Section */}
      {/* Show results only when NOT processing AND there's a processed image */}
      {processedImageBase64 && !processing && (
        <div className="mt-6 p-4 border rounded-lg shadow-sm bg-base-100">
          <h2 className="text-xl font-semibold mb-3">Processed Image Results</h2>
          <p className="mb-2"><span className="font-medium">Original File:</span> {originalFileName}</p>
          {/* --- ADDED: Display actual dimensions --- */}
          {processedDimensions && (
            <p className="mb-2">
                <span className="font-medium">Actual Dimensions:</span> {processedDimensions.width}px × {processedDimensions.height}px
            </p>
          )}
          {/* --- END ADDED --- */}
          <p className="mb-2"><span className="font-medium">Processed Base64 Length:</span> {base64Length.toLocaleString()}</p>

          {/* Display Processed Image Preview */}
           <div className="my-4">
             <h3 className="text-lg font-semibold mb-2">Preview (Max {settings.maxWidth}x{settings.maxHeight}px, Q: {settings.quality.toFixed(2)}):</h3>
             <img
                src={processedImageBase64}
                alt="Processed Preview"
                className="max-w-full h-auto border rounded-md shadow-md mx-auto bg-white" // Added bg-white for transparent parts if any
                // Style ensures preview doesn't exceed container, actual processed image follows constraints
                style={{ maxWidth: `min(${settings.maxWidth}px, 100%)`, maxHeight: `${settings.maxHeight}px`}}
                // Add actual width/height attributes for better browser rendering if needed
                width={processedDimensions?.width}
                height={processedDimensions?.height}
             />
           </div>

          {/* Display Base64 String (in a scrollable area) */}
          <div className="form-control mt-4">
             <label className="label" htmlFor="base64Output">
                <span className="label-text font-semibold">Processed Base64 String:</span>
             </label>
            <textarea
              id="base64Output"
              readOnly
              value={processedImageBase64}
              className="textarea textarea-bordered w-full h-40 text-xs font-mono" // Monospace font for Base64
              rows={5}
            />
          </div>
           <button
              className="btn btn-secondary btn-sm mt-2"
              onClick={() => navigator.clipboard.writeText(processedImageBase64)}
            >
              Copy Base64
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageProcessor;