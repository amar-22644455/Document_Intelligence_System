import os
import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import pickle
from PIL import Image
import pytesseract
from transformers import BlipProcessor, BlipForConditionalGeneration
from transformers import CLIPProcessor, CLIPModel
import torch
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# --------------------------
# Models
# --------------------------
# Text embedding (lightweight model for embeddings)
text_model = SentenceTransformer("all-MiniLM-L6-v2")

# BLIP model for image captions
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# CLIP model for image embeddings
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# --------------------------
# Functions
# --------------------------
def describe_image(image):
    """Generate a caption for an image using BLIP."""
    try:
        # Ensure image is PIL Image
        if not isinstance(image, Image.Image):
            image = Image.open(image)
        
        inputs = blip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            out = blip_model.generate(**inputs, max_length=50)
        
        # Decode the generated token IDs to text
        caption = blip_processor.tokenizer.decode(out[0], skip_special_tokens=True)
        return caption.strip() if caption else "No caption generated"
    except Exception as e:
        print(f"Warning: BLIP caption generation failed: {e}")
        return "Caption generation failed"

def get_image_embedding(image):
    """Generate CLIP embedding for an image."""
    try:
        # Ensure image is PIL Image
        if not isinstance(image, Image.Image):
            image = Image.open(image)
        
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_emb = clip_model.get_image_features(**inputs)
        
        return image_emb.squeeze(0).cpu().numpy()  # convert to 1D numpy array
    except Exception as e:
        print(f"Warning: CLIP embedding generation failed: {e}")
        return None

def create_embeddings(docs_dir, embeddings_dir):
    # Master dictionary to hold all grouped data
    # Format: {"filename.pdf": {"chunks": [...], "metadata": [...], "embeddings": [...]}}
    document_data = {} 
    image_embeddings_data = {} # Separate dictionary for CLIP embeddings

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    all_files = os.listdir(docs_dir)
    print(f"\n[DEBUG] Starting embedding for {len(all_files)} files in {docs_dir}")
    
    for file in all_files:
        path = os.path.join(docs_dir, file)
        print(f"\n[DEBUG] Processing file: {file}")
        
        # Temporary lists for the CURRENT file only
        current_file_chunks = []
        current_file_metadata = []
        
        # --------------------------
        # PDF Processing
        # --------------------------
        if file.lower().endswith(".pdf"):
            print(f"  -> Detected as PDF")
            try:
                pdf = fitz.open(path)
                print(f"  -> PDF opened successfully ({len(pdf)} pages)")
                for page_num in range(len(pdf)):
                    page = pdf[page_num]
                    page_text = page.get_text().strip()

                    if not page_text:
                        print(f"    - Page {page_num + 1}: empty/no text")
                        continue

                    page_chunks = splitter.split_text(page_text)
                    print(f"    - Page {page_num + 1}: {len(page_chunks)} chunks ({len(page_text)} chars)")
                    for chunk_index, chunk in enumerate(page_chunks):
                        current_file_chunks.append(chunk)
                        current_file_metadata.append({
                            "type": "pdf",
                            "page": page_num + 1,
                            "chunk_index": chunk_index,
                            "total_pages": len(pdf)
                        })
            except Exception as exc:
                print(f"  [Error] ERROR processing PDF: {type(exc).__name__}: {exc}")

        # --------------------------
        # TXT Processing
        # --------------------------
        elif file.lower().endswith(".txt"):
            print(f"  -> Detected as TXT")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
                
                print(f"  -> File read successfully ({len(text)} total chars)")
                text = text.strip()
                print(f"  -> After strip: {len(text)} chars")

                if text:
                    txt_chunks = splitter.split_text(text)
                    print(f"  -> Created {len(txt_chunks)} chunks")
                    for chunk_index, chunk in enumerate(txt_chunks):
                        current_file_chunks.append(chunk)
                        current_file_metadata.append({
                            "type": "txt",
                            "chunk_index": chunk_index
                        })
                else:
                    print(f"  [Error] SKIPPED: File is empty after stripping whitespace")
            except UnicodeDecodeError as exc:
                print(f"  [Error] ENCODING ERROR: Cannot read as UTF-8: {exc}")
                print(f"     Trying alternate encoding (latin-1)...")
                try:
                    with open(path, "r", encoding="latin-1") as f:
                        text = f.read().strip()
                    if text:
                        txt_chunks = splitter.split_text(text)
                        print(f"  -> Created {len(txt_chunks)} chunks (latin-1)")
                        for chunk_index, chunk in enumerate(txt_chunks):
                            current_file_chunks.append(chunk)
                            current_file_metadata.append({
                                "type": "txt",
                                "chunk_index": chunk_index
                            })
                except Exception as exc2:
                    print(f"  [Error] ALSO FAILED with latin-1: {exc2}")
            except Exception as exc:
                print(f"  [Error] ERROR processing TXT: {type(exc).__name__}: {exc}")

        # --------------------------
        # Image Processing
        # --------------------------
        elif file.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff")):
            print(f"  -> Detected as IMAGE")
            try:
                image = Image.open(path)
                print(f"  -> Image opened successfully ({image.size})")
                ocr_text = pytesseract.image_to_string(image).strip()
                caption = describe_image(image)
                print(f"  -> Caption: {caption[:50]}...")
                print(f"  -> OCR text: {len(ocr_text)} chars")

                combined_text = f"Caption: {caption}\nOCR Text: {ocr_text}" if ocr_text else f"Caption: {caption}"

                if combined_text.strip():
                    img_chunks = splitter.split_text(combined_text)
                    print(f"  -> Created {len(img_chunks)} chunks from combined text")
                    for chunk_index, chunk in enumerate(img_chunks):
                        current_file_chunks.append(chunk)
                        current_file_metadata.append({
                            "type": "image",
                            "chunk_index": chunk_index
                        })

                # CLIP embedding for whole image
                img_emb = get_image_embedding(image)
                if img_emb is not None:
                    image_embeddings_data[file] = img_emb
                    print(f"  -> CLIP embedding created")
                else:
                    print(f"  [Warning] CLIP embedding failed")

            except Exception as exc:
                print(f"  [Error] ERROR processing image: {type(exc).__name__}: {exc}")
        
        else:
            print(f"  [Skipped] SKIPPED: Unknown file type (extension not supported)")

        # --------------------------
        #  Embed and Store the File's Data
        # --------------------------
        # If we successfully extracted text for THIS file, embed it and save it to the dictionary
        if current_file_chunks:
            print(f"  [Success] Embedding {len(current_file_chunks)} chunks for '{file}'...")
            try:
                file_embeddings = text_model.encode(current_file_chunks, show_progress_bar=False)
                
                # Store everything neatly under the filename key
                document_data[file] = {
                    "chunks": current_file_chunks,
                    "metadata": current_file_metadata,
                    "embeddings": file_embeddings
                }
                print(f"  [Success] Successfully stored embeddings for '{file}'")
            except Exception as exc:
                print(f"  [Error] EMBEDDING ERROR for '{file}': {type(exc).__name__}: {exc}")
        else:
            print(f"  [Warning] SKIPPED EMBEDDING: No chunks extracted from '{file}'")

    print(f"\n[DEBUG] Embedding complete. Processed {len(document_data)} files successfully.")
    
    if not document_data:
        print("[Error] No document text found to embed across any files.")
        return False

    # --------------------------
    # Save the dictionaries
    # --------------------------
    print(f"\n[DEBUG] Saving embeddings to disk...")
    try:
        with open(os.path.join(embeddings_dir, "document_data.pkl"), "wb") as f:
            pickle.dump(document_data, f)
        print(f"  [Success] Saved document_data.pkl")

        with open(os.path.join(embeddings_dir, "image_embeddings_data.pkl"), "wb") as f:
            pickle.dump(image_embeddings_data, f)
        print(f"  [Success] Saved image_embeddings_data.pkl")
    except Exception as exc:
        print(f"  [Error] ERROR saving embeddings: {type(exc).__name__}: {exc}")
        return False

    print(f"\n[Success] Successfully processed and grouped {len(document_data.keys())} files.")
    return True