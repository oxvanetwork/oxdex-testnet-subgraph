import { AutoOxdexStaking } from "../generated/schema";
import { Deposit, OxdexVault, Withdraw} from "../generated/OxdexVault/OxdexVault";
import { BigInt } from "@graphprotocol/graph-ts"

export function handleDeposit(event: Deposit): void {
    let oxdexVaultContract = OxdexVault.bind(event.address);

    let entity = AutoOxdexStaking.load(event.params.sender.toHex())

    if (!entity) {
        entity = new AutoOxdexStaking(event.params.sender.toHex())

        entity.shareAmount = BigInt.fromI32(0)
        entity.stakeAmount = BigInt.fromI32(0)
    }

    entity.shareAmount = entity.shareAmount.plus(event.params.shares)
    entity.stakeAmount = entity.shareAmount.times(oxdexVaultContract.getPricePerFullShare()).div(BigInt.fromI32(10).pow(18))

    entity.save()
}
  
export function handleWithdraw(event: Withdraw): void {
    let oxdexVaultContract = OxdexVault.bind(event.address);
    let entity = AutoOxdexStaking.load(event.params.sender.toHex())

    if (!entity) {
        entity = new AutoOxdexStaking(event.params.sender.toHex())

        entity.shareAmount = BigInt.fromI32(0)
        entity.stakeAmount = BigInt.fromI32(0)
    }

    entity.shareAmount = entity.shareAmount.minus(event.params.shares)
    entity.stakeAmount = entity.shareAmount.times(oxdexVaultContract.getPricePerFullShare()).div(BigInt.fromI32(10).pow(18))

    entity.save()
}
