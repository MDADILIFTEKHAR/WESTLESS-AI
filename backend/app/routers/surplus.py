from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from backend.app.database import get_db
from backend.app.models import SurplusListing
from backend.app.schemas import (
    SurplusListingCreate,
    SurplusStatusUpdate,
    SurplusListingResponse,
)

router = APIRouter(prefix="/surplus-listings", tags=["Surplus Recovery"])

VALID_STATUSES = {"pending_review", "available", "claimed", "collected", "expired", "cancelled"}


@router.get("", response_model=List[SurplusListingResponse])
def list_surplus_listings(
    status: Optional[str] = Query(None, description="Filter by listing status"),
    category: Optional[str] = Query(None, description="Filter by food category"),
    db: Session = Depends(get_db),
):
    query = db.query(SurplusListing)
    if status:
        query = query.filter(SurplusListing.status == status)
    if category:
        query = query.filter(SurplusListing.food_category.ilike(f"%{category}%"))

    listings = query.order_by(SurplusListing.created_at.desc()).all()
    return listings


@router.post("", response_model=SurplusListingResponse, status_code=201)
def create_surplus_listing(listing_in: SurplusListingCreate, db: Session = Depends(get_db)):
    if listing_in.quantity_kg <= 0:
        raise HTTPException(status_code=400, detail="Surplus quantity must be greater than 0 kg.")

    initial_status = "available" if listing_in.review_status == "approved" else "pending_review"

    listing = SurplusListing(
        title=listing_in.title,
        food_category=listing_in.food_category,
        quantity_kg=round(listing_in.quantity_kg, 2),
        servings_estimate=listing_in.servings_estimate,
        prepared_time=listing_in.prepared_time,
        collection_deadline=listing_in.collection_deadline,
        allergens=listing_in.allergens,
        dietary_info=listing_in.dietary_info,
        storage_condition=listing_in.storage_condition,
        review_status=listing_in.review_status,
        approval_staff_name=listing_in.approval_staff_name,
        status=initial_status,
        is_demo_workflow=True,
    )
    try:
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error creating surplus listing: {str(e)}")


@router.patch("/{listing_id}/status", response_model=SurplusListingResponse)
def update_surplus_status(
    listing_id: int, status_update: SurplusStatusUpdate, db: Session = Depends(get_db)
):
    listing = db.query(SurplusListing).filter(SurplusListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail=f"Surplus listing #{listing_id} not found.")

    new_status = status_update.status.lower()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_status}'. Allowed: {sorted(list(VALID_STATUSES))}",
        )

    # 1. Verification for publishing as available
    if new_status == "available":
        review_status = status_update.review_status or listing.review_status
        staff_name = status_update.approval_staff_name or listing.approval_staff_name
        if review_status != "approved":
            raise HTTPException(
                status_code=400,
                detail="Safety protocol: Surplus listing must be marked 'approved' by kitchen staff before publishing as available.",
            )
        listing.review_status = "approved"
        if staff_name:
            listing.approval_staff_name = staff_name

    # 2. Verification for claiming
    if new_status == "claimed":
        if not (status_update.recipient_name or listing.recipient_name):
            raise HTTPException(
                status_code=400,
                detail="Recipient name is required to claim a surplus rescue listing.",
            )
        listing.recipient_name = status_update.recipient_name or listing.recipient_name
        listing.recipient_contact = status_update.recipient_contact or listing.recipient_contact
        listing.recipient_organization = status_update.recipient_organization or listing.recipient_organization
        listing.claimed_at = datetime.now(timezone.utc)

    # 3. Verification for collection
    if new_status == "collected":
        if listing.status != "claimed" and not listing.recipient_name:
            raise HTTPException(
                status_code=400,
                detail="Cannot mark as collected before listing has been claimed and assigned to a recipient.",
            )
        listing.collected_at = datetime.now(timezone.utc)

    listing.status = new_status
    if status_update.verification_notes:
        listing.verification_notes = status_update.verification_notes

    try:
        db.commit()
        db.refresh(listing)
        return listing
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error updating surplus status: {str(e)}")


@router.delete("/{listing_id}", status_code=204)
def delete_surplus_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(SurplusListing).filter(SurplusListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail=f"Surplus listing #{listing_id} not found.")
    try:
        db.delete(listing)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error deleting surplus listing: {str(e)}")
