import time
from typing import Dict, List, Optional
from ortools.sat.python import cp_model
from ..models.schemas import SBCRequirement, SBCSolutionResponse, RatingBreakdown

DEFAULT_FODDER_PRICES: Dict[int, int] = {
    70: 200,
    71: 200,
    72: 250,
    73: 250,
    74: 300,
    75: 350,
    76: 400,
    77: 450,
    78: 500,
    79: 550,
    80: 600,
    81: 650,
    82: 750,
    83: 1100,
    84: 2700,
    85: 5300,
    86: 10000,
    87: 14500,
    88: 22000,
    89: 34000,
    90: 42000,
    91: 58000,
    92: 85000,
    93: 130000,
    94: 190000,
    95: 250000,
    96: 350000,
    97: 500000,
    98: 750000,
    99: 1000000,
}

def solve_sbc(req: SBCRequirement) -> SBCSolutionResponse:
    start_time = time.perf_counter()

    target_rating = req.target_rating
    club_inv = {int(k): int(v) for k, v in (req.club_inventory or {}).items() if int(v) > 0}
    custom_prices = {int(k): int(v) for k, v in (req.custom_prices or {}).items()}
    prices = {**DEFAULT_FODDER_PRICES, **custom_prices}

    # Dynamically ensure all tiers in club inventory and target_rating are included
    all_needed_ratings = set(club_inv.keys()) | {target_rating}
    for r in all_needed_ratings:
        if r not in prices:
            if r > 99:
                prices[r] = 1000000 + (r - 99) * 100000
            elif r < 70:
                prices[r] = max(150, 200 - (70 - r) * 20)
            else:
                prices[r] = 1000

    # Prune candidate market tiers around target rating to guarantee <300ms CP-SAT solves,
    # while strictly retaining all untradeables from club inventory
    market_min = max(min(prices.keys()), target_rating - 4)
    market_max = min(max(prices.keys()), target_rating + 4)
    relevant_tiers = {t for t in prices.keys() if market_min <= t <= market_max}
    relevant_tiers |= all_needed_ratings
    tiers = sorted(relevant_tiers)

    model = cp_model.CpModel()

    # 11 player card slots
    NUM_SLOTS = 11
    r_slots = [model.NewIntVar(min(tiers), max(tiers), f"slot_{i}") for i in range(NUM_SLOTS)]

    # Symmetry breaking: r_0 <= r_1 <= ... <= r_10
    for i in range(NUM_SLOTS - 1):
        model.Add(r_slots[i] <= r_slots[i + 1])

    # Boolean indicators b[i][t]: card slot i has rating t
    b = {}
    for i in range(NUM_SLOTS):
        for t in tiers:
            b[i, t] = model.NewBoolVar(f"b_{i}_{t}")
        # Exactly one tier per slot
        model.Add(sum(b[i, t] for t in tiers) == 1)
        # Link slot rating to chosen tier
        model.Add(r_slots[i] == sum(t * b[i, t] for t in tiers))

    # Tally cards per tier
    n = {}
    x = {} # tradeable bought
    y = {} # untradeable used from club
    for t in tiers:
        n[t] = model.NewIntVar(0, NUM_SLOTS, f"n_{t}")
        x[t] = model.NewIntVar(0, NUM_SLOTS, f"x_{t}")
        u_t = int(club_inv.get(t, 0))
        y[t] = model.NewIntVar(0, min(NUM_SLOTS, u_t), f"y_{t}")

        # Link count to slot booleans
        model.Add(n[t] == sum(b[i, t] for i in range(NUM_SLOTS)))
        # n_t = x_t + y_t
        model.Add(n[t] == x[t] + y[t])

    # Total cards must be 11
    model.Add(sum(n[t] for t in tiers) == NUM_SLOTS)

    # EA Sports FC Non-Linear Squad Rating Formulation
    # Sum of ratings
    S = model.NewIntVar(NUM_SLOTS * min(tiers), NUM_SLOTS * max(tiers), "sum_ratings")
    model.Add(S == sum(r_slots))

    # Scaled excess: e_i = max(0, 11 * r_i - S)
    zero_var = model.NewConstant(0)
    e_vars = []
    for i in range(NUM_SLOTS):
        diff_i = model.NewIntVar(-NUM_SLOTS * max(tiers), NUM_SLOTS * max(tiers), f"diff_{i}")
        model.Add(diff_i == NUM_SLOTS * r_slots[i] - S)
        e_i = model.NewIntVar(0, NUM_SLOTS * max(tiers), f"e_{i}")
        model.AddMaxEquality(e_i, [zero_var, diff_i])
        e_vars.append(e_i)

    # Squad Rating threshold: floor((S + E) / 11) >= target_rating
    # 11 * S + sum(e_i) >= 121 * target_rating
    model.Add(NUM_SLOTS * S + sum(e_vars) >= (NUM_SLOTS * NUM_SLOTS) * target_rating)

    # Objective: Minimize total coin spend on tradeables
    total_cost = sum(prices[t] * x[t] for t in tiers)
    model.Minimize(total_cost)

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_workers = 4

    status_code = solver.Solve(model)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        status = "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE"
        chosen_ratings = [solver.Value(r_slots[i]) for i in range(NUM_SLOTS)]
        chosen_ratings.sort(reverse=True)

        # Calculate exact achieved rating
        sum_r = sum(chosen_ratings)
        mean_r = sum_r / 11.0
        excess = sum(max(0.0, r - mean_r) for r in chosen_ratings)
        achieved_rating = round((sum_r + excess) / 11.0, 2)

        total_coin_cost = int(solver.ObjectiveValue())
        flat_rate_unit = prices.get(target_rating, 0)
        naive_flat_cost = flat_rate_unit * 11
        savings = max(0, naive_flat_cost - total_coin_cost)

        breakdown: List[RatingBreakdown] = []
        for t in sorted(tiers, reverse=True):
            count_t = solver.Value(n[t])
            if count_t > 0:
                untrad = solver.Value(y[t])
                trad = solver.Value(x[t])
                unit_p = prices[t]
                breakdown.append(
                    RatingBreakdown(
                        rating=t,
                        count=count_t,
                        unit_cost=unit_p,
                        untradeable_used=untrad,
                        tradeable_bought=trad,
                        subtotal_cost=trad * unit_p,
                    )
                )

        explanation = (
            f"Optimized combination: {len(breakdown)} rating tiers yielding {achieved_rating} squad rating. "
            f"Total market coin spend: {total_coin_cost:,} coins (saving {savings:,} vs naive 11x{target_rating})."
        )

        return SBCSolutionResponse(
            status=status,
            target_rating=target_rating,
            achieved_rating=achieved_rating,
            total_coin_cost=total_coin_cost,
            naive_flat_cost=naive_flat_cost,
            savings=savings,
            ratings_needed=chosen_ratings,
            breakdown=breakdown,
            solver_time_ms=round(elapsed_ms, 2),
            explanation=explanation,
        )
    else:
        return SBCSolutionResponse(
            status="INFEASIBLE",
            target_rating=target_rating,
            achieved_rating=0.0,
            total_coin_cost=0,
            naive_flat_cost=0,
            savings=0,
            ratings_needed=[],
            breakdown=[],
            solver_time_ms=round(elapsed_ms, 2),
            explanation="Could not find a feasible combination for requirements within available rating tiers.",
        )
