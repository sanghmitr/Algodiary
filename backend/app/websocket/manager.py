import asyncio
from collections import defaultdict
from uuid import UUID
from fastapi import WebSocket

from app.redis_client import get_redis
from app.services.auth_service import decode_token


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        self.listeners: dict[str, asyncio.Task] = {}

    async def authenticate(self, token: str) -> str:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return str(UUID(payload["sub"]))

    async def connect(self, websocket: WebSocket, token: str) -> str:
        user_id = await self.authenticate(token)
        await websocket.accept()
        self.active_connections[user_id].append(websocket)
        if user_id not in self.listeners:
            self.listeners[user_id] = asyncio.create_task(self._listen(user_id))
        return user_id

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        sockets = self.active_connections.get(user_id, [])
        if websocket in sockets:
            sockets.remove(websocket)
        if not sockets:
            self.active_connections.pop(user_id, None)
            task = self.listeners.pop(user_id, None)
            if task:
                task.cancel()

    async def broadcast(self, user_id: str, message: str) -> None:
        stale: list[WebSocket] = []
        for connection in self.active_connections.get(user_id, []):
            try:
                await connection.send_text(message)
            except RuntimeError:
                stale.append(connection)
        for connection in stale:
            await self.disconnect(user_id, connection)

    async def _listen(self, user_id: str) -> None:
        redis = get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"ws:{user_id}")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await self.broadcast(user_id, message["data"])
        finally:
            await pubsub.unsubscribe(f"ws:{user_id}")
            await pubsub.aclose()


manager = ConnectionManager()

