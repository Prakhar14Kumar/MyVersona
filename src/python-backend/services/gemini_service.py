"""
Gemini Service Implementation
Features MD5 prompt hashing mapped to Redis to entirely bypass external billing
for repeated user prompts.
"""
from typing import List, Dict, Any
import logging
import json

from core.cache import get_cache, set_cache, generate_prompt_hash

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Initialize your Google Generative AI client here usually
        # import google.generativeai as genai
        pass

    async def _execute_with_cache(self, prompt: str, payload: dict, ttl: int = 604800) -> Any:
        """
        Executes a Gemini call but strictly checks the Redis cache first.
        ttl=604800 is 7 Days. AI advice rarely changes within a week.
        """
        # 1. Deterministic Prompt Hash ensures re-ordering JSON keys doesn't break cache
        cache_key = f"ai:{generate_prompt_hash({'prompt': prompt, **payload})}"
        
        # 2. Redis Cache Lookup (0 cost, ~2ms latency)
        cached_result = await get_cache(cache_key)
        if cached_result:
            logger.info(f"⚡ [CACHE HIT] Served Gemini response from Redis: {cache_key}")
            return cached_result
            
        # 3. Cache Miss - Call External API
        logger.info(f"🐌 [CACHE MISS] Calling Gemini API natively...")
        
        # Mocking an actual external call here (Replace with GenAI logic)
        # response = await genai.generate_content_async(prompt)
        # result = response.text
        import asyncio
        await asyncio.sleep(2) # Simulating heavy AI processing time
        result = {"generated_text": f"Simulated AI response for: {prompt[:20]}..."}
        
        # 4. Store in Redis
        await set_cache(cache_key, result, ttl_seconds=ttl)
        
        return result

    async def generate_learning_path(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        prompt = f"Create a step-by-step learning path from {current_skills} to {target_role}."
        payload = {"type": "learning_path", "skills": current_skills, "role": target_role}
        
        return await self._execute_with_cache(prompt, payload)

    async def enhance_resume(self, resume_text: str) -> Dict[str, Any]:
        prompt = f"Improve this resume text for ATS parsing: {resume_text}"
        payload = {"type": "resume_enhance", "text_snippet": resume_text[:50]} # only hashing first 50 chars to save memory
        
        return await self._execute_with_cache(prompt, payload)
