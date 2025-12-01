from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Tickets ASIGNADOS al usuario
    tickets = relationship(
        "Ticket",
        back_populates="assignee",
        foreign_keys="Ticket.assigned_to_id"    
    )

    # Tickets CREADOS por este usuario
    my_tickets = relationship(
        "Ticket",
        back_populates="owner",
        foreign_keys="Ticket.owner_id"         
    )

    # Proyectos del usuario
    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="projects")

    tickets = relationship("Ticket", back_populates="project")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20))
    priority = Column(String(20))

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # 🔥 NUEVO: dueño del ticket
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relaciones
    project = relationship("Project", back_populates="tickets")

    assignee = relationship(
        "User",
        back_populates="tickets",
        foreign_keys=[assigned_to_id]            
    )

    owner = relationship(
        "User",
        back_populates="my_tickets",
        foreign_keys=[owner_id]                 
    )
