import pytest
from backend.models.schemas import SBCRequirement
from backend.solvers.sbc_solver import solve_sbc

def test_sbc_solver_target_85_no_untradeables():
    req = SBCRequirement(target_rating=85)
    sol = solve_sbc(req)

    assert sol.status == "OPTIMAL"
    assert len(sol.ratings_needed) == 11
    assert sol.achieved_rating >= 85.0
    assert sol.total_coin_cost <= sol.naive_flat_cost
    assert sol.solver_time_ms < 1000.0

def test_sbc_solver_target_87_with_untradeables():
    req = SBCRequirement(
        target_rating=87,
        club_inventory={89: 1, 88: 2}
    )
    sol = solve_sbc(req)

    assert sol.status == "OPTIMAL"
    assert len(sol.ratings_needed) == 11
    assert sol.achieved_rating >= 87.0
    # Untradeables should reduce coin spend
    total_untradeables = sum(b.untradeable_used for b in sol.breakdown)
    assert total_untradeables >= 1

def test_sbc_solver_target_88_optimal_excess():
    req = SBCRequirement(target_rating=88)
    sol = solve_sbc(req)

    assert sol.status in ("OPTIMAL", "FEASIBLE")
    assert len(sol.ratings_needed) == 11
    assert sol.achieved_rating >= 88.0

    # Verify arithmetic of achieved rating vs ratings_needed
    ratings = sol.ratings_needed
    mean_r = sum(ratings) / 11.0
    excess = sum(max(0.0, r - mean_r) for r in ratings)
    computed_rating = (sum(ratings) + excess) / 11.0
    assert round(computed_rating, 2) == sol.achieved_rating
    assert int(computed_rating) >= 88

def test_sbc_solver_fully_untradeable_squad():
    # When user owns 11 untradeable 88 cards, coin cost must be 0
    req = SBCRequirement(
        target_rating=88,
        club_inventory={88: 11}
    )
    sol = solve_sbc(req)

    assert sol.status == "OPTIMAL"
    assert sol.total_coin_cost == 0
    assert sum(b.untradeable_used for b in sol.breakdown) == 11
    assert sum(b.tradeable_bought for b in sol.breakdown) == 0

def test_sbc_solver_untradeable_high_tier_95():
    # When user owns a 95-rated card, the solver must recognize and utilize it
    req_without = SBCRequirement(target_rating=88)
    sol_without = solve_sbc(req_without)

    req_with = SBCRequirement(
        target_rating=88,
        club_inventory={95: 1}
    )
    sol_with = solve_sbc(req_with)

    assert sol_with.status == "OPTIMAL"
    assert any(b.rating == 95 and b.untradeable_used == 1 for b in sol_with.breakdown)
    assert sol_with.total_coin_cost < sol_without.total_coin_cost

def test_sbc_solver_string_keys_and_target_83():
    # String keys in JSON payload should be cleanly handled
    req = SBCRequirement(
        target_rating=83,
        club_inventory={"84": 2, "83": 3} # type: ignore
    )
    sol = solve_sbc(req)

    assert sol.status == "OPTIMAL"
    assert len(sol.ratings_needed) == 11
    assert sol.achieved_rating >= 83.0
    assert sum(b.untradeable_used for b in sol.breakdown) >= 1

