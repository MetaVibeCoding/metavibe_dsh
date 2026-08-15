"""Service layer: use-case orchestration + transaction boundary."""
from repository.user_repository import UserRepository
from domain.user import User


class CreateUserUseCase:
    def __init__(self, users: UserRepository):
        self._users = users

    def execute(self, email: str, password: str) -> User:
        User.validate_password(password)
        return self._users.save(email, password)


class GetUserUseCase:
    def __init__(self, users: UserRepository):
        self._users = users

    def execute(self, user_id: int) -> User | None:
        return self._users.find_by_id(user_id)
