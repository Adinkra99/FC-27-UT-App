from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class SBCRequirement(BaseModel):
    target_rating: int = Field(..., ge=60, le=99, description="Target squad rating e.g. 86")
    min_chemistry: Optional[int] = Field(0, ge=0, le=33)
    min_totw_count: Optional[int] = 0
    max_league_count: Optional[int] = None
    club_inventory: Optional[Dict[int, int]] = Field(
        default_factory=dict,
        description="Dict mapping rating tier to count of owned untradeables: {88: 1, 84: 4}"
    )
    locked_player_ids: Optional[List[str]] = Field(default_factory=list)
    custom_prices: Optional[Dict[int, int]] = Field(
        default_factory=dict,
        description="Optional custom fodder price overrides per rating"
    )

class RatingBreakdown(BaseModel):
    rating: int
    count: int
    unit_cost: int
    untradeable_used: int
    tradeable_bought: int
    subtotal_cost: int

class SBCSolutionResponse(BaseModel):
    status: str  # 'OPTIMAL', 'FEASIBLE', 'INFEASIBLE'
    target_rating: int
    achieved_rating: float
    total_coin_cost: int
    naive_flat_cost: int
    savings: int
    ratings_needed: List[int]
    breakdown: List[RatingBreakdown]
    solver_time_ms: float
    explanation: str
