from fastapi import Request, HTTPException
import time
from collections import defaultdict
from typing import Dict, List

class RateLimiter:
    """
    A simple in-memory Rate Limiter for endpoints.
    In a high-scale production environment with multiple server instances, 
    this would be backed by Redis instead of memory.
    """
    def __init__(self, requests: int, window: int):
        self.rate_limit = requests
        self.window = window
        self.requests_record: Dict[str, List[float]] = defaultdict(list)

    def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old timestamps outside the window
        self.requests_record[client_ip] = [
            timestamp for timestamp in self.requests_record[client_ip] 
            if now - timestamp < self.window
        ]
        
        # Check if they have exceeded the limit
        if len(self.requests_record[client_ip]) >= self.rate_limit:
            raise HTTPException(
                status_code=429, 
                detail="Too Many Requests. Please wait before trying again."
            )
            
        # Record this request
        self.requests_record[client_ip].append(now)

# Create instances for specific endpoints (5 requests per 60 seconds)
upload_rate_limiter = RateLimiter(requests=5, window=60)
process_rate_limiter = RateLimiter(requests=5, window=60)
