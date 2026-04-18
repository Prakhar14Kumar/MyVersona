from fastapi import Depends, HTTPException, status
from firebase_admin import firestore
import logging

from dependencies.auth_dependency import get_current_user

logger = logging.getLogger(__name__)

# Note: The database client should be initialized explicitly if not done elsewhere.
# Assuming setup_firebase() in core.security has already booted the default app.
def get_db():
    return firestore.client()

async def verify_and_deduct_credits(
    user: dict = Depends(get_current_user),
    cost: int = 1
) -> dict:
    """
    CRITICAL BILLING PROXY:
    Explicitly retrieves the user's secure wallet state via the Admin SDK,
    bypassing all client-side manipulations.
    If the user has sufficient balance or an active subscription, the transaction
    is approved and credits are atomically deducted.
    """
    db = get_db()
    uid = user.get("uid")
    user_ref = db.collection("users").document(uid)
    
    try:
        # We run this in a transaction to ensure atomic deduction and prevent race conditions if hitting 
        # routes simultaneously via async bursts.
        @firestore.transactional
        def process_billing(transaction, doc_ref):
            snapshot = doc_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise ValueError("User missing database entry.")
                
            data = snapshot.to_dict()
            sub_tier = data.get("subscription", {}).get("tier", "free")
            
            # Unlimited Bypass for paid subscribers
            if sub_tier == "pro":
                return True
                
            balance_path = "credits.balance"
            current_balance = data.get("credits", {}).get("balance", 0)
            
            if current_balance < cost:
                raise ValueError("Insufficient Sparks")
                
            # Syntactically deduct safely via Firebase FieldValue (Atomically avoids overwrite bugs)
            # Alternatively, since we are inside a transaction, setting explicitly is also fine.
            new_balance = current_balance - cost
            transaction.update(doc_ref, {balance_path: new_balance})
            return True

        # Execute Transaction
        transaction = db.transaction()
        process_billing(transaction, user_ref)
        
        return user # Pass user object down the chain successfully
        
    except ValueError as ve:
        err_msg = str(ve)
        logger.warning(f"Billing Interception [UID: {uid}]: {err_msg}")
        if "Insufficient" in err_msg:
            raise HTTPException(
                status_code=402, # 402 Payment Required officially signals paywall interaction needed
                detail="Insufficient Sparks to complete this AI request. Please top up."
            )
        raise HTTPException(status_code=403, detail="Account configuration error.")
    except Exception as e:
        logger.error(f"Critical DB Billing fail for {uid}: {str(e)}")
        # We fail closed! If Firebase is down, we do NOT allow free exploitation.
        raise HTTPException(
            status_code=500,
            detail="Billing gateway unavailable. Try again shortly."
        )
