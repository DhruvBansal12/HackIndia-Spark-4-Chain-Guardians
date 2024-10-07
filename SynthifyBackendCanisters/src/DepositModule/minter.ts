import {
    blob,
    CallResult,
    nat8,
    nat32,
    nat64,
    Opt,
    Principal,
    Record,
    Service,
    serviceUpdate,
    Variant,
    Vec
} from 'azle';

export class Minter extends Service {
    @serviceUpdate
    get_btc_address: (
        arg: Record<{
            owner: Opt<Principal>;
            subaccount: Opt<blob>;
        }>
    ) => CallResult<string>;

    @serviceUpdate
    update_balance: (
        arg: Record<{
            owner: Opt<Principal>;
            subaccount: Opt<blob>;
        }>
    ) => CallResult<UpdateBalanceResult>;
}

export type UpdateBalanceResult = Variant<{
    Ok: Vec<UtxoStatus>;
    Err: UpdateBalanceError;
}>;

// The result of an [update_balance] call.
type UtxoStatus = Variant<{
   
    ValueTooSmall: Utxo;
    // The KYT provider considered this UTXO to be tained. This UTXO state is
    // final, retrying [update_balance] call will have no effect on this UTXO.
    Tainted: Utxo;
   
    Checked: Utxo;
    // The UTXO passed the KYT check, and ckBTC has been minted.
    Minted: Record<{
        block_index: nat64;
        minted_amount: nat64;
        utxo: Utxo;
    }>;
}>;

type Utxo = Record<{
    outpoint: Record<{ txid: Vec<nat8>; vout: nat32 }>;
    value: nat64;
    height: nat32;
}>;

type UpdateBalanceError = Variant<{
    // There are no new UTXOs to process.
    NoNewUtxos: Record<{
        current_confirmations: Opt<nat32>;
        required_confirmations: nat32;
    }>;
    // The minter is already processing another update balance request for the caller.
    AlreadyProcessing: null;
    // The minter is overloaded, retry the request.
    // The payload contains a human-readable message explaining what caused the unavailability.
    TemporarilyUnavailable: string;
    // A generic error reserved for future extensions.
    GenericError: Record<{ error_message: string; error_code: nat64 }>;
}>;
