from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Column, Integer, String, Text

from app.db.session import Base

EMBEDDING_DIM = 1536  # text-embedding-3-small


class DocumentChunk(Base):

    __tablename__ = "document_chunks"

    chunk_id = Column(String(64), primary_key=True)
    document_id = Column(String(100), nullable=False, index=True)
    source_file = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    page_marker = Column(String(50), nullable=True)
    chunk_type = Column(String(20), nullable=False)
    is_atomic = Column(Boolean, nullable=False, default=False)
    chunk_index = Column(Integer, nullable=True)
    page_chunk_index = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    element_number = Column(Integer, nullable=True)
    element_title = Column(String(255), nullable=True)
    pdf_page_label = Column(String(50), nullable=True)
    embedding = Column(Vector(EMBEDDING_DIM), nullable=False)