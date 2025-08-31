from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from googletrans import Translator
from langdetect import detect
import os
from dotenv import load_dotenv
import io
import base64
import tempfile
import mimetypes
import chardet

# Try to import Whisper for better speech recognition
try:
    import whisper
    import torch
    import soundfile as sf
    import numpy as np
    WHISPER_AVAILABLE = True
    print("✅ Whisper loaded successfully")
except ImportError as e:
    WHISPER_AVAILABLE = False
    print("⚠️ Whisper not available, using browser speech recognition only")
    print(f"Install with: pip install openai-whisper torch torchaudio")

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize translator
translator = Translator()

# Initialize Whisper if available (simplified approach)
whisper_model = None
if WHISPER_AVAILABLE:
    try:
        # Use tiny model for faster processing
        whisper_model = whisper.load_model("tiny")
        print("✅ Whisper tiny model loaded successfully")
    except Exception as e:
        print(f"⚠️ Failed to load Whisper model: {e}")
        whisper_model = None

# Ollama configuration - Use the best available model
OLLAMA_URL = "http://localhost:11434/api/generate"

# Try to use the most capable model available, fallback to phi if others aren't available
def get_best_available_model():
    """Determine the best available Ollama model for enhanced linguistic understanding"""
    try:
        # Check what models are available
        models_response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if models_response.status_code == 200:
            models = models_response.json().get('models', [])
            model_names = [model['name'] for model in models]
            
            # Preference order: best to least capable for linguistic nuances
            # Prioritize larger models for better understanding of context, idioms, and cultural nuances
            preferred_models = [
                'llama3.1:70b', 'llama3.1:8b', 'llama3:70b', 'llama3:8b', 'llama3.1', 'llama3',
                'mistral:7b', 'mistral', 'phi3:14b', 'phi3:7b', 'phi:latest', 'phi'
            ]
            
            for preferred in preferred_models:
                if preferred in model_names:
                    print(f"✅ Using {preferred} model for enhanced linguistic understanding")
                    return preferred
        
        # Fallback to phi if nothing else is available
        print("⚠️ Using phi model as fallback")
        return "phi"
    except Exception as e:
        print(f"⚠️ Could not check available models, using phi: {e}")
        return "phi"

MODEL_NAME = get_best_available_model()

class UniversalChatbot:
    def __init__(self):
        self.translator = translator
        self.supported_languages = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'hi': 'Hindi', 'te': 'Telugu', 'mr': 'Marathi', 'kn': 'Kannada',
            'gu': 'Gujarati', 'ta': 'Tamil', 'ml': 'Malayalam', 'pa': 'Punjabi',
            'ar': 'Arabic', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 
            'pt': 'Portuguese', 'ru': 'Russian', 'it': 'Italian'
        }
        # Enhanced linguistic patterns for better understanding
        self.idiom_patterns = [
            'piece of cake', 'break a leg', 'it\'s raining cats and dogs', 'kill two birds',
            'the ball is in your court', 'break the ice', 'once in a blue moon',
            'bite the bullet', 'hit the nail on the head', 'when pigs fly'
        ]
        self.formality_indicators = {
            'formal': ['sir', 'madam', 'please', 'kindly', 'would you', 'could you', 'may i'],
            'informal': ['hey', 'yo', 'what\'s up', 'gonna', 'wanna', 'yeah', 'nah']
        }
        
    def detect_linguistic_complexity(self, text):
        """Analyze text for linguistic complexity and cultural elements"""
        text_lower = text.lower()
        complexity = {
            'has_idioms': any(idiom in text_lower for idiom in self.idiom_patterns),
            'formality_level': self.detect_formality_level(text_lower),
            'has_cultural_references': self.detect_cultural_references(text_lower),
            'sentiment': self.detect_sentiment_indicators(text_lower),
            'grammar_complexity': self.assess_grammar_complexity(text)
        }
        return complexity
    
    def detect_formality_level(self, text_lower):
        """Detect formality level of the text"""
        formal_count = sum(1 for word in self.formality_indicators['formal'] if word in text_lower)
        informal_count = sum(1 for word in self.formality_indicators['informal'] if word in text_lower)
        
        if formal_count > informal_count:
            return 'formal'
        elif informal_count > formal_count:
            return 'informal'
        else:
            return 'neutral'
    
    def detect_cultural_references(self, text_lower):
        """Detect cultural or location-specific references"""
        cultural_keywords = [
            'thanksgiving', 'diwali', 'christmas', 'ramadan', 'new year',
            'subway', 'underground', 'tube', 'metro', 'football', 'soccer',
            'dollars', 'euros', 'pounds', 'rupees', 'yen'
        ]
        return any(keyword in text_lower for keyword in cultural_keywords)
    
    def detect_sentiment_indicators(self, text_lower):
        """Detect emotional tone and sentiment"""
        positive_words = ['great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'happy']
        negative_words = ['terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'bad']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def assess_grammar_complexity(self, text):
        """Assess grammatical complexity of the text"""
        # Simple heuristics for complexity
        sentences = text.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        has_complex_structures = any(marker in text.lower() for marker in [
            'however', 'nevertheless', 'furthermore', 'consequently', 'meanwhile',
            'which', 'whom', 'whose', 'that', 'although', 'whereas'
        ])
        
        if avg_sentence_length > 15 or has_complex_structures:
            return 'complex'
        elif avg_sentence_length > 8:
            return 'moderate'
        else:
            return 'simple'
        
    def detect_language(self, text):
        try:
            detected = detect(text)
            return detected if detected in self.supported_languages else 'en'
        except Exception:
            return 'en'
    
    def classify_query(self, message_lower):
        """Classify the user's query to provide more relevant responses"""
        # More specific translation patterns
        translation_patterns = ['translate', 'translation', 'convert to', 'how to say', 'what does', 'mean in', 'say in']
        if any(word in message_lower for word in translation_patterns):
            return 'translation'
        
        # SDG and equality topics
        elif any(word in message_lower for word in ['sdg', 'sustainable development', 'inequality', 'equality', 'discrimination', 'rights', 'barrier']):
            return 'sdg_equality'
        
        # Help and features
        elif any(word in message_lower for word in ['help', 'what can you do', 'features', 'how do you work', 'capabilities']):
            return 'help_info'
        
        # Greetings
        elif any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon']) and len(message_lower.split()) <= 5:
            return 'greeting'
        
        # Language and culture topics - enhanced for linguistics
        elif any(word in message_lower for word in ['language', 'speak', 'communication', 'culture', 'cultural', 'idiom', 'phrase', 'expression', 'formality', 'formal', 'informal', 'grammar', 'figurative', 'literal', 'politeness', 'ambiguous', 'ambiguity', 'sentiment', 'tone']):
            return 'language_culture'
        
        # Technology and science topics
        elif any(word in message_lower for word in ['technology', 'ai', 'artificial intelligence', 'machine learning', 'nlp', 'natural language', 'computer', 'programming', 'science', 'physics', 'chemistry', 'biology', 'mathematics']):
            return 'general_question'
        
        # General knowledge questions
        elif any(word in message_lower for word in ['what is', 'how does', 'why is', 'explain', 'tell me about', 'describe', 'define', 'difference between']) or '?' in message_lower:
            return 'general_question'
        
        else:
            return 'general'
    
    def extract_text_from_file(self, file_content, filename):
        """Extract text content from various file types"""
        try:
            # Detect file type
            file_extension = os.path.splitext(filename)[1].lower()
            
            if file_extension in ['.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv']:
                # Text-based files
                try:
                    # Try UTF-8 first
                    return file_content.decode('utf-8')
                except UnicodeDecodeError:
                    # Detect encoding using chardet
                    detected = chardet.detect(file_content)
                    encoding = detected.get('encoding', 'utf-8')
                    try:
                        return file_content.decode(encoding)
                    except Exception:
                        # Fallback to latin-1 which accepts any byte sequence
                        return file_content.decode('latin-1', errors='ignore')
            
            elif file_extension == '.pdf':
                # For PDF files, we'd need additional libraries like PyPDF2
                return "PDF file detected. Please convert to text format for translation."
            
            elif file_extension in ['.doc', '.docx']:
                # For Word documents, we'd need python-docx
                return "Word document detected. Please save as text file for translation."
            
            else:
                # Try to treat as text anyway
                try:
                    return file_content.decode('utf-8', errors='ignore')
                except Exception:
                    return "Unsupported file format. Please use text files (.txt, .md, .py, etc.)"
                    
        except Exception as e:
            return f"Error reading file: {str(e)}"
    
    def translate_file_content(self, text_content, target_language, source_language=None):
        """Translate the content of a file while preserving structure"""
        try:
            if not text_content or text_content.strip() == "":
                return "File appears to be empty or unreadable."
            
            # For very large files, split into chunks
            max_chunk_size = 4000  # Google Translate API limit consideration
            
            if len(text_content) <= max_chunk_size:
                # Small file, translate directly
                return self.translate_text(text_content, target_language, source_language)
            
            # Large file, split into paragraphs and translate
            paragraphs = text_content.split('\n\n')
            translated_paragraphs = []
            
            current_chunk = ""
            for paragraph in paragraphs:
                if len(current_chunk + paragraph + '\n\n') <= max_chunk_size:
                    current_chunk += paragraph + '\n\n'
                else:
                    # Translate current chunk
                    if current_chunk.strip():
                        translated_chunk = self.translate_text(current_chunk.strip(), target_language, source_language)
                        translated_paragraphs.append(translated_chunk)
                    current_chunk = paragraph + '\n\n'
            
            # Translate remaining chunk
            if current_chunk.strip():
                translated_chunk = self.translate_text(current_chunk.strip(), target_language, source_language)
                translated_paragraphs.append(translated_chunk)
            
            return '\n\n'.join(translated_paragraphs)
            
        except Exception as e:
            return f"Translation error: {str(e)}"
    
    def create_enhanced_prompt(self, message, query_type, language):
        """Create context-specific prompts for better relevance and linguistic understanding"""
        base_context = "You are a Universal Language Support Assistant with deep expertise in linguistics, cultural nuances, and cross-cultural communication. You promote equality and reduce barriers (SDG 10) through accurate, culturally-sensitive responses."
        
        # Analyze message for linguistic complexity
        complexity = self.detect_linguistic_complexity(message)
        
        if query_type == 'translation':
            return f"""{base_context}

User needs translation help: "{message}"

LINGUISTIC ANALYSIS:
- Formality level: {complexity['formality_level']}
- Contains idioms: {complexity['has_idioms']}
- Cultural references: {complexity['has_cultural_references']}
- Sentiment: {complexity['sentiment']}
- Grammar complexity: {complexity['grammar_complexity']}

PROVIDE COMPREHENSIVE TRANSLATION ASSISTANCE:
1. If specific translation requested, provide accurate translation
2. Address idioms with cultural equivalents, not literal translations
3. Preserve formality level and politeness markers
4. Explain cultural adaptations when needed
5. Handle ambiguities by providing context
6. Maintain sentiment and tone appropriately
7. Suggest alternative phrasings for better cultural fit

Be precise, culturally aware, and linguistically accurate."""

        elif query_type == 'sdg_equality':
            return f"""{base_context}

User asking about equality/SDG topics: "{message}"

Provide comprehensive information about:
- SDG 10 (Reducing Inequalities) with specific examples
- How language barriers contribute to inequality
- Real-world applications and success stories
- Practical steps for promoting equality
- Cultural sensitivity in global communication
- Economic and social impacts of language accessibility

Be factual, inspiring, and actionable with concrete examples."""

        elif query_type == 'help_info':
            return f"""{base_context}

User wants to know capabilities: "{message}"

Explain comprehensive features:
- Advanced translation with idiom handling and cultural adaptation
- Formality level preservation (formal/informal/neutral)
- Cultural reference localization
- Sentiment and tone preservation
- Grammar and word order adjustments
- Named entity recognition and adaptation
- Ambiguity resolution with context
- Voice input/output with multilingual support
- File translation with structure preservation

Provide specific examples of complex linguistic challenges you can handle."""

        elif query_type == 'greeting':
            return f"""{base_context}

User greeting: "{message}"
Formality detected: {complexity['formality_level']}

Respond appropriately:
- Match their formality level ({complexity['formality_level']})
- Be culturally appropriate and warm
- Briefly introduce advanced linguistic capabilities
- Ask how you can help with translation or language questions
- Show understanding of cross-cultural communication"""

        elif query_type == 'language_culture':
            return f"""{base_context}

User asking about language/culture: "{message}"

Provide expert information about:
- Linguistic nuances and cultural contexts
- Translation challenges (idioms, formality, cultural references)
- Cross-cultural communication best practices
- Language learning tips and cultural awareness
- How language shapes thought and culture
- Politeness systems across languages
- Regional variations and dialects

Be educational, culturally sensitive, and linguistically precise."""

        elif query_type == 'information_request':
            return f"""{base_context}

User question: "{message}"

PROVIDE COMPREHENSIVE ANSWER:
- Answer the specific question directly and accurately
- Include relevant examples and practical information
- Consider cultural context when appropriate
- Relate to language/communication when relevant
- Use appropriate technical depth for the question
- Be thorough but concise

Focus on being helpful, accurate, and educational."""

        elif query_type == 'technology':
            return f"""{base_context}

User technology question: "{message}"

Explain clearly:
- Technical concepts in accessible language
- How technology relates to language accessibility
- AI and NLP capabilities and limitations
- Translation technology and cultural challenges
- Privacy and ethical considerations
- Future developments in language technology
- Practical applications for reducing language barriers

Be informative, accurate, and relate to equality/accessibility goals."""

        else:  # general
            return f"""{base_context}

User message: "{message}"
Complexity analysis: {complexity}

Provide thoughtful, comprehensive response:
- Address their message thoroughly and relevantly
- Consider linguistic and cultural nuances
- Demonstrate deep understanding of language and culture
- Offer insights into communication challenges if relevant
- Provide practical, actionable information
- Show cultural sensitivity and awareness
- Ask clarifying questions if the request is ambiguous
- Connect to language accessibility and equality when appropriate

Be genuinely helpful, culturally aware, and linguistically sophisticated."""
    
    def create_multilingual_prompt(self, message, query_type, language_name):
        """Create prompts for non-English interactions"""
        return f"""You are a Universal Language Support Assistant promoting global equality (SDG 10). The user is communicating in {language_name}.

User's message: "{message}"
Query type: {query_type}

Provide a helpful response in English (it will be automatically translated to {language_name}):
- Understand the cultural context of {language_name} speakers
- Be respectful of {language_name} cultural norms
- Answer their specific question or need
- Relate to equality and inclusion when relevant
- Keep cultural sensitivity in mind
- Provide practical, actionable information

Respond clearly and helpfully."""
    
    def translate_text(self, text, target_language='en', source_language=None):
        """Enhanced translation with linguistic awareness"""
        try:
            if source_language is None:
                source_language = self.detect_language(text)
            
            if source_language == target_language:
                return text
            
            # Analyze linguistic complexity before translation
            complexity = self.detect_linguistic_complexity(text)
            
            # For complex text with idioms or cultural references, provide context
            if complexity['has_idioms'] or complexity['has_cultural_references']:
                # Use basic translation but add explanatory note
                result = self.translator.translate(text, dest=target_language, src=source_language)
                translated = result.text
                
                explanatory_notes = []
                if complexity['has_idioms']:
                    explanatory_notes.append("Note: This text contains idioms that may not translate literally.")
                if complexity['has_cultural_references']:
                    explanatory_notes.append("Note: This text contains cultural references that may need localization.")
                
                if explanatory_notes:
                    return f"{translated}\n\n{' '.join(explanatory_notes)}"
                return translated
            else:
                # Standard translation for simpler text
                result = self.translator.translate(text, dest=target_language, src=source_language)
                return result.text
                
        except Exception as e:
            print(f"Translation error: {e}")
            return f"Translation failed: {str(e)}"
    
    def enhanced_translate_with_context(self, text, target_language, source_language=None, preserve_formality=True):
        """Advanced translation with formality and context preservation"""
        try:
            complexity = self.detect_linguistic_complexity(text)
            
            # Build context-aware prompt for AI-assisted translation
            context_prompt = f"""
Translate the following text from {source_language or 'auto-detected language'} to {target_language}.

IMPORTANT CONSIDERATIONS:
- Formality level: {complexity['formality_level']}
- Contains idioms: {complexity['has_idioms']}
- Cultural references: {complexity['has_cultural_references']}
- Sentiment: {complexity['sentiment']}
- Grammar complexity: {complexity['grammar_complexity']}

TRANSLATION GUIDELINES:
1. Preserve the formality level ({complexity['formality_level']})
2. If idioms are present, provide culturally appropriate equivalents in {target_language}
3. Adapt cultural references to {target_language} context when appropriate
4. Maintain the emotional tone ({complexity['sentiment']})
5. Preserve the meaning while adapting to natural {target_language} word order

Text to translate: "{text}"

Provide ONLY the translation, nothing else."""
            
            # Try AI-assisted translation for complex cases
            if complexity['has_idioms'] or complexity['formality_level'] != 'neutral' or complexity['has_cultural_references']:
                ai_translation = self.get_ai_translation(context_prompt)
                if ai_translation and len(ai_translation.strip()) > 0:
                    return ai_translation
            
            # Fallback to standard translation
            return self.translate_text(text, target_language, source_language)
            
        except Exception as e:
            print(f"Enhanced translation error: {e}")
            return self.translate_text(text, target_language, source_language)
    
    def get_ai_translation(self, prompt):
        """Get AI-assisted translation for complex linguistic cases"""
        try:
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Very low temperature for accurate translation
                    "max_tokens": 500,
                    "top_p": 0.9,
                    "num_predict": 500,
                    "stop": ["\n\nTranslate", "\n\nNote:", "Guidelines:", "IMPORTANT:"]
                }
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=20)
            
            if response.status_code == 200:
                result = response.json()
                translation = result.get('response', '').strip()
                
                # Clean up the response
                if translation and not translation.startswith("I cannot") and not translation.startswith("Sorry"):
                    return translation
            
            return None
            
        except Exception as e:
            print(f"AI translation error: {e}")
            return None
    
    def handle_translation_request(self, message, target_language='en'):
        """Handle specific translation requests"""
        try:
            # Extract text to translate and target language from the message
            message_lower = message.lower()
            
            # Simple patterns for translation requests
            if 'translate' in message_lower:
                # Extract the text after "translate"
                parts = message.split('translate', 1)
                if len(parts) > 1:
                    text_to_translate = parts[1].strip()
                    
                    # Remove common prepositions
                    text_to_translate = text_to_translate.replace(' to ', ' ').replace(' into ', ' ')
                    
                    # Check for target language in the message
                    for lang_code, lang_name in self.supported_languages.items():
                        if lang_name.lower() in message_lower or lang_code in message_lower:
                            target_language = lang_code
                            break
                    
                    # Clean up the text to translate
                    words_to_remove = ['spanish', 'french', 'german', 'hindi', 'arabic', 'chinese', 'japanese', 'korean', 'portuguese', 'russian', 'italian', 'english']
                    for word in words_to_remove:
                        text_to_translate = text_to_translate.replace(word, '').strip()
                    
                    if text_to_translate:
                        translated = self.translate_text(text_to_translate, target_language)
                        return f"Translation: {translated}"
            
            # If no specific translation found, provide general translation help
            return f"I can help you translate text! Please specify what you'd like to translate and to which language. For example: 'Translate hello to Spanish' or 'Convert this text to French: [your text]'"
            
        except Exception as e:
            print(f"Translation request error: {e}")
            return "I'm having trouble with that translation request. Please try rephrasing it, like: 'Translate [text] to [language]'"
    
    def generate_response_with_ollama(self, message, language='en'):
        try:
            # Analyze the message to determine context and intent
            message_lower = message.lower()
            
            # Determine the type of query for better context
            query_type = self.classify_query(message_lower)
            
            # Create more focused prompts for better responses
            if query_type == 'translation':
                prompt = f"Help with this translation request: {message}\n\nProvide accurate translation with cultural context. If it's an idiom or cultural expression, explain the meaning and provide equivalent expressions."
            elif query_type == 'general_question':
                prompt = f"Question: {message}\n\nProvide a clear, accurate answer. Be concise but comprehensive."
            elif query_type == 'greeting':
                prompt = f"User greeting: {message}\n\nRespond warmly and professionally. Briefly mention your translation and language support capabilities."
            elif query_type == 'language_culture':
                prompt = f"Language/culture question: {message}\n\nProvide expert information about linguistic nuances, cultural contexts, and cross-cultural communication."
            else:
                prompt = f"User message: {message}\n\nProvide a helpful, accurate response. Focus on being informative and relevant."

            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,  # Balanced creativity and accuracy
                    "max_tokens": 400,   # Reasonable length for focused responses
                    "top_p": 0.9,       
                    "num_predict": 400,
                    "top_k": 40,         
                    "repeat_penalty": 1.1,
                    "stop": ["\n\nUser:", "\n\nHuman:", "###", "\n\n---"]
                }
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                generated_response = result.get('response', '').strip()
                
                # Basic cleaning - remove system artifacts but keep content
                if generated_response:
                    # Remove common prefixes
                    if generated_response.lower().startswith('as an ai'):
                        generated_response = generated_response.split('.', 1)[-1].strip()
                    if generated_response.lower().startswith('as a'):
                        generated_response = generated_response.split('.', 1)[-1].strip()
                    
                    # Ensure we have substantial content
                    if len(generated_response) > 10:
                        return generated_response
                
                # If response is too short or empty, try fallback
                print(f"Generated response too short: '{generated_response}'")
                return self.get_fallback_response(message, language)
            else:
                print(f"Ollama API error: {response.status_code} - {response.text}")
                return self.get_fallback_response(message, language)
                
        except requests.exceptions.ConnectionError:
            print("Ollama connection failed - using fallback")
            return self.get_fallback_response(message, language)
        except Exception as e:
            print(f"Ollama error: {e}")
            return self.get_fallback_response(message, language)
    
    def clean_and_improve_response(self, response, query_type, original_message):
        """Clean up and improve the AI response for relevance"""
        if not response:
            return response
            
        # Remove common AI artifacts
        response = response.strip()
        
        # Remove repetitive or irrelevant prefixes
        prefixes_to_remove = [
            "As a Universal Language Support Assistant",
            "As an AI assistant",
            "I'm here to help",
            "Response:",
            "Answer:",
            "Here's my response:",
            "I understand that"
        ]
        
        for prefix in prefixes_to_remove:
            if response.lower().startswith(prefix.lower()):
                response = response[len(prefix):].strip()
                if response.startswith(',') or response.startswith(':'):
                    response = response[1:].strip()
        
        # Remove redundant endings
        endings_to_remove = [
            "I hope this helps!",
            "Let me know if you need more help.",
            "Feel free to ask more questions.",
            "Is there anything else I can help you with?"
        ]
        
        for ending in endings_to_remove:
            if response.lower().endswith(ending.lower()):
                response = response[:-len(ending)].strip()
                if response.endswith('.'):
                    pass  # Keep the period
                elif response.endswith(','):
                    response = response[:-1] + '.'
                elif not response.endswith('.') and not response.endswith('!') and not response.endswith('?'):
                    response += '.'
        
        # Ensure response is relevant to the query type
        if query_type == 'translation' and 'translate' not in response.lower():
            # If it's a translation request but response doesn't mention translation, try to fix it
            if len(original_message.split()) < 10:  # Short message, likely a direct translation request
                pass  # Keep the response as is, might be the actual translation
        
        # Limit response length for relevance
        if len(response) > 1000:  # Too long, likely not focused
            sentences = response.split('. ')
            if len(sentences) > 3:
                response = '. '.join(sentences[:3]) + '.'
        
        # Ensure minimum quality
        if len(response.strip()) < 10:
            return None  # Will trigger fallback
            
        return response
    
    def get_fallback_response(self, message, language='en'):
        """Fallback responses when Ollama is not available"""
        message_lower = message.lower()
        
        # General greeting responses
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']):
            responses = {
                'en': "Hello! I'm your Universal Language Support Assistant. I can help you with questions, translations, and information about equality and inclusion. What would you like to know?",
                'es': "¡Hola! Soy tu Asistente Universal de Soporte de Idiomas. Puedo ayudarte con preguntas, traducciones e información sobre igualdad e inclusión. ¿Qué te gustaría saber?",
                'fr': "Bonjour! Je suis votre Assistant Universel de Support Linguistique. Je peux vous aider avec des questions, des traductions et des informations sur l'égalité et l'inclusion. Que voulez-vous savoir?",
                'hi': "नमस्ते! मैं आपका यूनिवर्सल भाषा सहायता सहायक हूं। मैं आपको प्रश्नों, अनुवादों और समानता तथा समावेश के बारे में जानकारी के साथ मदद कर सकता हूं।"
            }
            return responses.get(language, responses['en'])
        
        # Translation requests
        elif any(word in message_lower for word in ['translate', 'translation', 'convert']):
            responses = {
                'en': "I can help you translate text between multiple languages! Just tell me what you'd like to translate and which language you want it in. For example: 'Translate Hello to Spanish' or just type your text and I'll help translate it.",
                'es': "¡Puedo ayudarte a traducir texto entre múltiples idiomas! Solo dime qué te gustaría traducir y en qué idioma lo quieres. Por ejemplo: 'Traduce Hola al inglés'.",
                'fr': "Je peux vous aider à traduire du texte entre plusieurs langues! Dites-moi simplement ce que vous aimeriez traduire et dans quelle langue vous le voulez."
            }
            return responses.get(language, responses['en'])
        
        # Questions about functionality
        elif any(word in message_lower for word in ['help', 'what can you do', 'how do you work', 'features']):
            responses = {
                'en': "I can help you with: 1) Answering questions on various topics, 2) Translating between 12+ languages, 3) Voice input and output, 4) Information about equality and reducing inequalities (SDG 10), 5) Cross-cultural communication. What would you like assistance with?",
                'es': "Puedo ayudarte con: 1) Responder preguntas sobre varios temas, 2) Traducir entre más de 12 idiomas, 3) Entrada y salida de voz, 4) Información sobre igualdad y reducción de desigualdades (ODS 10), 5) Comunicación intercultural.",
                'fr': "Je peux vous aider avec: 1) Répondre aux questions sur divers sujets, 2) Traduire entre plus de 12 langues, 3) Entrée et sortie vocales, 4) Informations sur l'égalité et la réduction des inégalités (ODD 10), 5) Communication interculturelle."
            }
            return responses.get(language, responses['en'])
        
        # SDG 10 related responses
        elif any(word in message_lower for word in ['inequality', 'discrimination', 'equality', 'rights', 'inclusion', 'sdg', 'sustainable']):
            responses = {
                'en': "SDG 10 aims to reduce inequalities within and among countries. This includes promoting equal opportunities, fighting discrimination, and ensuring inclusive participation in society. I can help you understand specific aspects of inequality or suggest ways to promote equality. What would you like to know?",
                'es': "El ODS 10 tiene como objetivo reducir las desigualdades dentro y entre países. Esto incluye promover la igualdad de oportunidades, combatir la discriminación y asegurar la participación inclusiva en la sociedad.",
                'fr': "L'ODD 10 vise à réduire les inégalités au sein des pays et entre eux. Cela inclut la promotion de l'égalité des chances, la lutte contre la discrimination et la participation inclusive dans la société."
            }
            return responses.get(language, responses['en'])
        
        # General questions - provide a helpful response
        elif '?' in message or any(word in message_lower for word in ['what', 'how', 'why', 'when', 'where', 'who']):
            responses = {
                'en': f"I understand you're asking about '{message}'. While I can help with many topics including translations, equality issues, and general questions, I'd be happy to provide more specific information if you could rephrase your question. What exactly would you like to know?",
                'es': f"Entiendo que estás preguntando sobre '{message}'. Aunque puedo ayudar con muchos temas incluyendo traducciones, cuestiones de igualdad y preguntas generales, estaría feliz de proporcionar información más específica.",
                'fr': f"Je comprends que vous posez une question sur '{message}'. Bien que je puisse aider avec de nombreux sujets, je serais heureux de fournir des informations plus spécifiques."
            }
            return responses.get(language, responses['en'])
        
        # Default response for other inputs
        else:
            responses = {
                'en': f"Thank you for your message: '{message}'. I'm here to help with translations, answer questions, and provide information about equality and inclusion. Could you please let me know specifically how I can assist you today?",
                'es': f"Gracias por tu mensaje: '{message}'. Estoy aquí para ayudar con traducciones, responder preguntas y proporcionar información sobre igualdad e inclusión. ¿Podrías decirme específicamente cómo puedo ayudarte hoy?",
                'fr': f"Merci pour votre message: '{message}'. Je suis là pour aider avec les traductions, répondre aux questions et fournir des informations sur l'égalité et l'inclusion. Pourriez-vous me dire spécifiquement comment je peux vous aider aujourd'hui?"
            }
            return responses.get(language, responses['en'])

chatbot = UniversalChatbot()

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        if not WHISPER_AVAILABLE:
            return jsonify({'error': 'Speech recognition not available on server. Using browser recognition.'}), 400
        
        data = request.get_json()
        audio_data = data.get('audio', '')
        language = data.get('language', 'en')
        
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Decode base64 audio data
        audio_bytes = base64.b64decode(audio_data)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe with Whisper
            result = whisper_model.transcribe(temp_file_path, language=language if language != 'auto' else None)
            transcription = result['text'].strip()
            detected_language = result.get('language', language)
            
            return jsonify({
                'transcription': transcription,
                'detected_language': detected_language,
                'confidence': result.get('avg_logprob', 0)
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        print(f"Speech recognition error: {e}")
        return jsonify({'error': 'Speech recognition failed'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        input_language = data.get('input_language', 'auto')
        output_language = data.get('output_language', 'en')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Detect the language of the input message
        detected_lang = chatbot.detect_language(message)
        
        # Use detected language if input_language is 'auto'
        actual_input_lang = detected_lang if input_language == 'auto' else input_language
        
        # Translate message to English for processing if needed
        message_for_processing = message
        if actual_input_lang != 'en':
            try:
                message_for_processing = chatbot.translate_text(message, 'en', actual_input_lang)
            except Exception as e:
                print(f"Translation error: {e}")
                message_for_processing = message
        
        # Check if this is a translation request
        is_translation_request = any(word in message_for_processing.lower() for word in [
            'translate', 'translation', 'convert to', 'in spanish', 'in french', 'in german', 
            'in hindi', 'in arabic', 'in chinese', 'in japanese', 'in korean', 'in portuguese', 
            'in russian', 'in italian', 'in telugu', 'in tamil', 'in marathi'
        ])
        
        if is_translation_request:
            # Handle translation requests with enhanced linguistic understanding
            response = chatbot.handle_translation_request(message_for_processing, output_language)
        else:
            # Generate regular response using enhanced Ollama prompting
            response = chatbot.generate_response_with_ollama(message_for_processing, output_language)
        
        # Translate response to user's preferred output language if needed with enhanced translation
        final_response = response
        translation = None
        
        if output_language != 'en' and output_language != 'auto' and not is_translation_request:
            try:
                # Use enhanced translation for better cultural and linguistic adaptation
                final_response = chatbot.enhanced_translate_with_context(response, output_language, 'en')
                translation = response  # Keep original English response as translation
            except Exception as e:
                print(f"Response translation error: {e}")
                # Fallback to basic translation
                try:
                    final_response = chatbot.translate_text(response, output_language, 'en')
                except Exception:
                    final_response = response
        
        return jsonify({
            'response': final_response,
            'detected_language': detected_lang,
            'input_language': actual_input_lang,
            'output_language': output_language,
            'translation': translation if output_language != 'en' and output_language != 'auto' else None,
            'message_processed': message_for_processing
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'error': 'Internal server error', 
            'response': "I'm sorry, I'm having technical difficulties. Please try again.",
            'detected_language': 'en',
            'input_language': input_language,
            'output_language': output_language
        }), 500

@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        target_language = data.get('target_language', 'en')
        source_language = data.get('source_language', None)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        translated_text = chatbot.translate_text(text, target_language, source_language)
        detected_lang = chatbot.detect_language(text) if not source_language else source_language
        
        return jsonify({
            'translated_text': translated_text,
            'source_language': detected_lang,
            'target_language': target_language
        })
        
    except Exception as e:
        print(f"Error in translate endpoint: {e}")
        return jsonify({'error': 'Translation failed'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    # Check Ollama connection
    ollama_status = False
    try:
        response = requests.get("http://localhost:11434/api/version", timeout=5)
        ollama_status = response.status_code == 200
    except Exception:
        pass
    
    return jsonify({
        'status': 'healthy',
        'ollama_connected': ollama_status,
        'supported_languages': list(chatbot.supported_languages.keys())
    })

@app.route('/api/translate-file', methods=['POST'])
def translate_file():
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        target_language = request.form.get('target_language', 'en')
        source_language = request.form.get('source_language', None)
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file content
        file_content = file.read()
        filename = file.filename
        
        # Extract text from file
        text_content = chatbot.extract_text_from_file(file_content, filename)
        
        if text_content.startswith("Error") or text_content.startswith("Unsupported") or "detected" in text_content:
            return jsonify({'error': text_content}), 400
        
        # Detect source language if not provided
        detected_lang = chatbot.detect_language(text_content[:1000])  # Use first 1000 chars for detection
        actual_source_lang = source_language if source_language and source_language != 'auto' else detected_lang
        
        # Translate the content
        translated_content = chatbot.translate_file_content(text_content, target_language, actual_source_lang)
        
        # Get file info
        file_size = len(file_content)
        file_extension = os.path.splitext(filename)[1].lower()
        
        return jsonify({
            'success': True,
            'original_filename': filename,
            'file_size': file_size,
            'file_type': file_extension,
            'detected_language': detected_lang,
            'source_language': actual_source_lang,
            'target_language': target_language,
            'original_content': text_content[:500] + '...' if len(text_content) > 500 else text_content,  # Preview
            'translated_content': translated_content,
            'char_count': len(text_content),
            'translated_char_count': len(translated_content)
        })
        
    except Exception as e:
        print(f"Error in file translation: {e}")
        return jsonify({
            'error': f'File translation failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🌍 Universal Language Support Chatbot Starting...")
    print("📱 Frontend: http://localhost:3001")
    print("🔧 Backend API: http://localhost:5000")
    print("🤖 Make sure Ollama is running on http://localhost:11434")
    print("💡 Promoting SDG 10: Reducing Inequalities through language accessibility")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
