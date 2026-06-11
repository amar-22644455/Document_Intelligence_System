# src/rag_pipeline.py

from .retriever import Retriever
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv()

COMPARISON_PROMPT_TEMPLATE = """
You are an expert Document Intelligence AI performing a high-accuracy semantic comparison between two specific documents.

You MUST return ONLY valid JSON. No extra text, no markdown block formatting.

--------------------------------------------------
STRICT COMPARISON RULES:
1. TARGET PARAMETERS: Identify what the user is specifically asking to compare in the USER QUERY. Base your comparison strictly on those requested parameters.
2. DEFAULT PARAMETERS: If the query is generic, evaluate and compare these core categories:
   - Purpose & Scope
   - Key Information, Expertise & Insights
   - Main Elements / Content / Requirements
   - Technical or Operational Details
   - Constraints, Gaps or Differences
3. DO NOT use generic placeholders like "Document A" or "Document B" inside the text values of your JSON response (e.g. in "summary", "document_a", "document_b", "difference", "insights" explanation, "verdict", and "final_answer"). Instead, refer to {file_a} and {file_b} by their exact filenames.
4. If {file_a} contains information that {file_b} does not, explicitly state "Not mentioned in {file_b}" (and vice versa).
5. "evidence" MUST be an array of exact chunk labels (e.g., ["[DocA - Chunk 1]"]).
6. ALWAYS follow the JSON format EXACTLY. DO NOT add explanations outside the JSON object.
7. CITE YOUR SOURCES: If referencing specific locations in the documents, use simple page numbers (e.g. [Page X] or simply Page X) when applicable. Do NOT write raw filenames or technical labels like "- Chunk X" in the text fields of your JSON response. Focus on writing clean, natural, and human-readable text.

--------------------------------------------------
RETURN FORMAT (STRICT JSON):

{{
  "summary": "A concise overview of how {file_a} and {file_b} differ fundamentally.",
  "comparison": [
    {{
      "category": "The specific parameter being compared",
      "document_a": "Summary of {file_a}'s information regarding this parameter",
      "document_b": "Summary of {file_b}'s information regarding this parameter",
      "difference": "The exact material difference between {file_a} and {file_b} regarding this parameter"
    }}
  ],
  "insights": [
    {{
      "title": "Key insight or observation",
      "explanation": "Why this difference or similarity matters between {file_a} and {file_b}",
      "evidence": ["exact chunk reference 1", "exact chunk reference 2"]
    }}
  ],
  "verdict": "Clear and objective conclusion highlighting the major distinctions between {file_a} and {file_b}.",
  "final_answer": "Direct answer to the specific user query based on the comparison."
}}

--------------------------------------------------
DOCUMENT A ({file_a}):
{context_a}

DOCUMENT B ({file_b}):
{context_b}

USER QUERY:
{query}

RETURN ONLY JSON:
"""


DOCUMENT_INTELLIGENCE_PROMPT_TEMPLATE = """
You are an advanced Document Intelligence AI designed for semantic search, document understanding, and context-grounded question answering.

You MUST return ONLY valid JSON. No extra text, no markdown block formatting.

--------------------------------------------------
STRICT RULES:
1. Use ONLY the provided context. DO NOT assume facts outside the document.
2. If the answer is not present in the context, output:
   "Information not found in the provided document."
3. "evidence" MUST be an array of exact chunk labels
   (e.g., ["[Document - Chunk 2]"]).
4. Generate concise, accurate, and context-grounded responses.
5. Output MUST always be valid JSON.
6. CITE YOUR SOURCES: Do NOT output raw filenames or technical labels like "Chunk X" inside the generated text fields of your JSON response. If referencing locations in a PDF, use simple page numbers (e.g., [Page X]). Keep all text clean, professional, and reader-friendly.

--------------------------------------------------
FOCUS ON:
- Semantic understanding of the document
- Extracting key insights and important details
- Identifying important constraints, responsibilities, or requirements
- Summarizing complex information clearly
- Answering user queries with source-grounded reasoning

--------------------------------------------------
RETURN FORMAT (STRICT JSON):

{{
  "summary": "Detailed and objective summary of the document section relevant to the query.",
  "key_insights": [
    {{
      "title": "Key insight or topic",
      "explanation": "Clear explanation of the insight",
      "evidence": ["chunk reference"]
    }}
  ],
  "relevant_sections": [
    {{
      "section_title": "Relevant topic or section",
      "section_summary": "Plain-English explanation of the section"
    }}
  ],
  "final_answer": "Detailed and direct answer to the user query based solely on the document context."
}}

--------------------------------------------------
CONTEXT:
{context}

--------------------------------------------------
USER QUERY:
{query}

--------------------------------------------------
RETURN ONLY JSON:
"""


CHAT_PROMPT_TEMPLATE = """
You are a helpful and precise Document Intelligence AI answering user questions strictly based on the provided document context.

You MUST return ONLY valid JSON. No extra text, no markdown block formatting.

--------------------------------------------------
STRICT RULES:
1. Use ONLY the provided context.
2. If the context does not contain the answer, state:
   "The provided document does not contain information to answer this query."
3. If there are no important observations or concerns, return an empty array [] for "insights".
4. Be clear, concise, and context-grounded.
5. CITE YOUR SOURCES: Do NOT output raw filenames or technical labels like "Chunk X" inside your final_answer text. If referencing locations in a PDF, use simple page numbers (e.g., [Page X]). Grounded sources will be displayed separately to the user, so focus on writing fluent, clean, and human-friendly sentences.

--------------------------------------------------
RETURN FORMAT (STRICT JSON):

{{
  "final_answer": "Your detailed and helpful answer to the user query.",
  "insights": [
    {{
      "title": "Important insight or observation",
      "importance": "Low | Medium | High"
    }}
  ]
}}

--------------------------------------------------
CONTEXT:
{context}

--------------------------------------------------
USER QUERY:
{query}

--------------------------------------------------
RETURN ONLY JSON:
"""

class RAGPipeline:
    def __init__(self, model="llama-3.1-8b-instant", embeddings_dir=None):
        self.embeddings_dir = embeddings_dir or os.path.join(PROJECT_ROOT, "embeddings")
        self.retriever = Retriever(self.embeddings_dir)
        self.model = model

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")

        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    # ==========================================
    # HELPER METHODS (Keeps code DRY)
    # ==========================================
    def _call_llm(self, prompt, max_tokens=1500):
        """Handles the Groq API call and JSON parsing to avoid duplicate code."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a strict Document Intelligence AI. Output ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                  ],
                temperature=0.2,
                max_tokens=max_tokens,
            )
            answer_text = response.choices[0].message.content.strip()
            
            if answer_text.startswith("```"):
                answer_text = answer_text.strip("`").removeprefix("json").strip()
                
            return json.loads(answer_text)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON output from LLM", "raw_output": answer_text}
        except Exception as e:
            return {"error": str(e)}

    def _build_context(self, results, label, max_chars=4000):
        """Safely builds the context string without exceeding token limits."""
        context_parts = []
        current_length = 0
        source_name = label if label else "Document"

        for i, r in enumerate(results):
            chunk_text = r["chunk"].strip()
            labeled_chunk = f"[{source_name} - Chunk {i+1}]\n{chunk_text}"
            
            if current_length + len(labeled_chunk) > max_chars:
                break
                
            context_parts.append(labeled_chunk)
            current_length += len(labeled_chunk)
            
        return "\n\n".join(context_parts)


    # ==========================================
    # CORE PIPELINE METHODS
    # ==========================================

    def query_document(self, query, target_file=None, is_chat=False, top_k=8):
        """
        FN 1: Use this for standard Q&A chat or searching a single file.
        """
        print(f"Querying {'Global' if not target_file else target_file}...")
        results = self.retriever.retrieve(query, top_k, source_filter=target_file)
        
        if not results:
            return {"answer": {"error": "No relevant context found."}, "sources": []}

        context = self._build_context(results, target_file, max_chars=6000)
        
        prompt = CHAT_PROMPT_TEMPLATE.format(context=context, query=query) if is_chat else DOCUMENT_INTELLIGENCE_PROMPT_TEMPLATE.format(context=context, query=query)
        
        answer_json = self._call_llm(prompt)
        
        return {
            "answer": answer_json,
            "sources": results
        }


    def compare_documents(self, query, file_a, file_b, top_k=8):
        """
        FN 2: Use this ONLY when the user explicitly hits the "Compare" button.
        """
        print(f"Comparing {file_a} vs {file_b}...")
        if not file_a or not file_b:
            return {"answer": {"error": "Comparison requires two files."}, "sources": []}

        results_a = self.retriever.retrieve(query, top_k, source_filter=file_a)
        results_b = self.retriever.retrieve(query, top_k, source_filter=file_b)

        if not results_a or not results_b:
            return {"answer": {"error": "Insufficient data in one or both documents for comparison."}, "sources": []}

        context_a = self._build_context(results_a, file_a)
        context_b = self._build_context(results_b, file_b)

        prompt = COMPARISON_PROMPT_TEMPLATE.format(
            file_a=file_a,
            file_b=file_b,
            context_a=context_a,
            context_b=context_b,
            query=query
        )
        
        answer_json = self._call_llm(prompt, max_tokens=1800)

        return {
            "answer": answer_json,
            "sources": {
                "docA": results_a,
                "docB": results_b
            }
        }


    def generate_summaries(self, files: list, top_k=5):
        """
        FN 3: Use this on page load. Pass a list of files (e.g., [file_a] or [file_a, file_b]).
        It returns a dictionary keyed by filename, perfect for your UI display sections.
        """
        print(f"Generating standard summaries for {len(files)} files...")
        
        # We give the LLM a generic prompt to trigger a good overall summary
        summary_query = "Provide a comprehensive summary of this document, extracting key insights and outlining any potential risks or important constraints to the user."
        ui_summary_data = {}
        for file in files:
            if not file:
                continue
                
            # Chronological Context Blending
            doc_info = self.retriever.document_data.get(file)
            if doc_info:
                chunks = doc_info["chunks"]
                metadata = doc_info["metadata"]
                
                # Fetch first 3 chunks (introduction/context)
                intro_chunks = []
                for idx in range(min(3, len(chunks))):
                    intro_chunks.append({
                        "chunk": chunks[idx],
                        "source": {**metadata[idx], "source": file},
                        "score": 1.0
                    })
                
                # Semantic search for top 12 chunks
                semantic_results = self.retriever.retrieve(summary_query, top_k=12, source_filter=file)
                
                # Merge intro and semantic results, avoiding duplicate chunks
                merged_results = intro_chunks.copy()
                seen_chunks = set(c["chunk"] for c in intro_chunks)
                for r in semantic_results:
                    if r["chunk"] not in seen_chunks:
                        merged_results.append(r)
                        seen_chunks.add(r["chunk"])
                
                # Sort chronologically by chunk index
                merged_results.sort(key=lambda x: x["source"].get("chunk_index", 0))
                results = merged_results
            else:
                results = self.retriever.retrieve(summary_query, top_k=12, source_filter=file)

            if not results:
                ui_summary_data[file] = {"answer": {"error": "No data found for summary."}, "sources": []}
                continue

            context = self._build_context(results, file, max_chars=9000)
            prompt = DOCUMENT_INTELLIGENCE_PROMPT_TEMPLATE.format(context=context, query=summary_query)
            
            ui_summary_data[file] = {
                "answer": self._call_llm(prompt),
                "sources": results
            }
        return ui_summary_data