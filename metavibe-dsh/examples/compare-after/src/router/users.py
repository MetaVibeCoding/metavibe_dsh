"""Router layer: transport only — DTO validation + service delegation."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from service.user_service import CreateUserUseCase, GetUserUseCase

router = APIRouter()


class CreateUserRequest(BaseModel):
    email: str
    password: str


@router.post("/users")
async def create_user(req: CreateUserRequest, use_case: CreateUserUseCase = Depends()):
    try:
        user = use_case.execute(req.email, req.password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {"id": user.id, "email": user.email}


@router.get("/users/{user_id}")
async def get_user(user_id: int, use_case: GetUserUseCase = Depends()):
    user = use_case.execute(user_id)
    if user is None:
        raise HTTPException(404, "not found")
    return {"id": user.id, "email": user.email}
