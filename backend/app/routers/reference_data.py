from fastapi import APIRouter

from ..schemas.metadata import ReferenceData
from ..services import metadata_repository

router = APIRouter()


@router.get("/", response_model=ReferenceData)
def get_reference_data() -> ReferenceData:
    return metadata_repository.get_reference_data()
