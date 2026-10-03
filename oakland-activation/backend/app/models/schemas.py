from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, model_validator


class TradeAvailability(BaseModel):
    trade: str
    label: str
    classification: str
    count: Optional[int] = None
    suppressed: bool
    display: str
    as_of: str
    source_id: str
    source_status: str

    @model_validator(mode="after")
    def suppress_small_cells(self):
        if self.count is not None and 0 < self.count < 5:
            raise ValueError("true small counts must not be serialized")
        if self.suppressed and self.count is not None:
            raise ValueError("suppressed cells cannot carry a count")
        return self
