"""Repository layer: isolates SQLAlchemy from the rest of the app."""
from sqlalchemy import text

from domain.user import User


class UserRepository:
    def __init__(self, engine):
        self._engine = engine

    def save(self, email: str, password_hash: str) -> User:
        with self._engine.connect() as conn:
            user_id = conn.execute(
                text("INSERT INTO users (email, password_hash) VALUES (:e, :p) RETURNING id"),
                {"e": email, "p": password_hash},
            ).scalar()
        return User(id=user_id, email=email, password_hash=password_hash)

    def find_by_id(self, user_id: int) -> User | None:
        with self._engine.connect() as conn:
            row = conn.execute(
                text("SELECT id, email, password_hash FROM users WHERE id = :id"), {"id": user_id}
            ).fetchone()
        return User(*row) if row else None
