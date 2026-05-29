# backend/app/models/weight_log.py
from sqlalchemy import Column, Integer, Date, DECIMAL, ForeignKey, UniqueConstraint
from app.database import Base


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    record_date = Column(Date, nullable=False)
    weight_kg = Column(DECIMAL(4, 1), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "record_date", name="uk_user_date"),
    )
