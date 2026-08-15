"""Before MetaVibe: a typical brute-force Vibe Coding router file.

Everything lives in one file: routing + validation + business logic + raw SQL.
"""
import sqlalchemy
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

router = APIRouter()

engine = sqlalchemy.create_engine("postgresql://localhost/app")


@router.post("/users")
async def create_user(email: str, password: str):
    # business rule inline in the router (no service layer)
    if len(password) < 8:
        raise HTTPException(400, "password too short")
    # direct DB access in the router (no repository layer)
    with engine.connect() as conn:
        result = conn.execute(
            text("INSERT INTO users (email, password_hash) VALUES (:e, :p) RETURNING id"),
            {"e": email, "p": password},
        )
        user_id = result.scalar()
    return {"id": user_id, "email": email}


@router.get("/users/{user_id}")
async def get_user(user_id: int):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, email FROM users WHERE id = :id"), {"id": user_id}
        ).fetchone()
    if row is None:
        raise HTTPException(404, "not found")
    return {"id": row[0], "email": row[1]}
