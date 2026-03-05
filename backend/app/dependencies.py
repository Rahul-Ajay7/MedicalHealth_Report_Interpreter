import os
from fastapi import Header, HTTPException
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Use service-role client to verify tokens
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def verify_token(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()

    try:
        # ✅ Supabase verifies the token using whatever key type is current
        # Works with both HS256 and ECC (P-256) — no manual JWT secret needed
        response = supabase_admin.auth.get_user(token)

        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Return same shape as before — payload["sub"] = user_id
        return { "sub": response.user.id }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")