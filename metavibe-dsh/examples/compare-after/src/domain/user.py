"""Domain layer: pure entity, zero framework dependencies (guarded)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class User:
    id: int
    email: str
    password_hash: str

    @staticmethod
    def validate_password(password: str) -> None:
        if len(password) < 8:
            raise ValueError("password too short")
