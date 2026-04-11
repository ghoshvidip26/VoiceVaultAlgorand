from beaker import *
from pyteal import *

app = Application("PaymentApp")

def logPayment(payer,receiver,amount): 
    return Log(Concat(
        Bytes("PAYMENT|"),
        payer,
        Bytes("|"),
        receiver,
        Bytes("|"),
        Itob(amount)
    ))
    
@app.external
def payWithRoyaltySplit(
    creator: abi.Address,
    platform: abi.Address,
    royaltyRecipient: abi.Address,
    amount: abi.Uint64
):
    paymentTxn = Gtxn[0]

    platformFee = ScratchVar(TealType.uint64)
    remaining = ScratchVar(TealType.uint64)
    royalty = ScratchVar(TealType.uint64)
    creatorAmt = ScratchVar(TealType.uint64)

    return Seq(
        Assert(Global.group_size() == Int(2)),

        # Validate payment txn
        Assert(paymentTxn.type_enum() == TxnType.Payment),
        Assert(paymentTxn.sender() == Txn.sender()),
        Assert(paymentTxn.receiver() == Global.current_application_address()),
        Assert(paymentTxn.amount() == amount.get()),

        # Validate inputs
        Assert(amount.get() > Int(0)),
        Assert(creator.get() != Global.zero_address()),
        Assert(platform.get() != Global.zero_address()),
        Assert(royaltyRecipient.get() != Global.zero_address()),

        # Fee calculations
        platformFee.store(WideRatio([amount.get(), Int(250)], [Int(10000)])),
        remaining.store(amount.get() - platformFee.load()),
        royalty.store(WideRatio([remaining.load(), Int(1000)], [Int(10000)])),
        creatorAmt.store(remaining.load() - royalty.load()),

        # Platform fee
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: platform.get(),
            TxnField.amount: platformFee.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),

        # Royalty
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: royaltyRecipient.get(),
            TxnField.amount: royalty.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),

        # Creator
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: creator.get(),
            TxnField.amount: creatorAmt.load(),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),

        Log(Bytes("PAYMENT_SPLIT_DONE")),
    )
    
@app.external
def payFullToCreator(
    creator: abi.Address,
    amount: abi.Uint64
): 
    paymentTxn = Gtxn[0]
    return Seq(
        # Validate payment txn
        Assert(paymentTxn.type_enum()==TxnType.Payment),
        Assert(paymentTxn.sender()==Txn.sender()),
        Assert(paymentTxn.amount()==amount.get()),
        
        Assert(amount.get() > Int(0)),
        Assert(creator.get() != Global.zero_address()),
        
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder().SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: creator.get(),
            TxnField.amount: amount.get()
        }),
        InnerTxnBuilder.Submit(),
        Log(Bytes("FULL_PAYMENT")),
    )
