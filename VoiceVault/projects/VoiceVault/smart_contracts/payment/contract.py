from algopy import (
    ARC4Contract,
    BigUInt,
    Global,
    UInt64,
    arc4,
    gtxn,
    itxn,
)


class PaymentApp(ARC4Contract):
    """
    A modern Algorand Python contract that handles payments with royalty splits.
    """

    @arc4.abimethod
    def pay_with_royalty_split(
        self,
        payment_txn: gtxn.PaymentTransaction,
        creator: arc4.Address,
        platform: arc4.Address,
        royalty_recipient: arc4.Address,
        amount: arc4.UInt64,
    ) -> None:
        assert (
            payment_txn.receiver == Global.current_application_address
        ), "Receiver must be this app"
        assert payment_txn.amount == amount.native, "Payment amount mismatch"

        # Fee calculations:
        # Platform Fee: 2.5% (250 / 10000)
        # Royalty: 10% of remaining (1000 / 10000)
        platform_fee = (amount.native * UInt64(250)) // UInt64(10000)
        remaining = amount.native - platform_fee
        royalty = (remaining * UInt64(1000)) // UInt64(10000)
        creator_amt = remaining - royalty

        # 1. Transfer Platform Fee
        itxn.Payment(
            receiver=platform.native,
            amount=platform_fee,
            fee=UInt64(0),
        ).submit()

        # 2. Transfer Royalty
        itxn.Payment(
            receiver=royalty_recipient.native,
            amount=royalty,
            fee=UInt64(0),
        ).submit()

        # 3. Transfer Creator Share
        itxn.Payment(
            receiver=creator.native,
            amount=creator_amt,
            fee=UInt64(0),
        ).submit()

    @arc4.abimethod
    def pay_full_to_creator(
        self,
        payment_txn: gtxn.PaymentTransaction,
        creator: arc4.Address,
        amount: arc4.UInt64,
    ) -> None:
        assert (
            payment_txn.receiver == Global.current_application_address
        ), "Receiver must be this app"
        assert payment_txn.amount == amount.native, "Payment amount mismatch"

        itxn.Payment(
            receiver=creator.native,
            amount=amount.native,
            fee=UInt64(0),
        ).submit()

    @arc4.abimethod(readonly=True)
    def calculate_payment_breakdown(
        self, amount: arc4.UInt64
    ) -> tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        # Platform Fee: 2.5%
        platform_fee = (amount.native * UInt64(250)) // UInt64(10000)
        remaining = amount.native - platform_fee
        # Royalty: 10% of remaining
        royalty = (remaining * UInt64(1000)) // UInt64(10000)
        creator_amt = remaining - royalty

        return (
            arc4.UInt64(platform_fee),
            arc4.UInt64(royalty),
            arc4.UInt64(creator_amt),
        )
