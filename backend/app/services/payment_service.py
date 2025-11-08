from __future__ import annotations


def create_payment_intent(*, booking_id: str, amount: float, user_id: str) -> str:
    # Replace with actual payment provider integration.
    return f"mock-payment-intent:{booking_id}"


def process_refund(booking_id: str) -> None:
    # Replace with payment refund logic.
    return None
