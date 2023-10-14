import { ManualOxdexStaking } from "../generated/schema";
import { Deposit, EmergencyWithdraw, Withdraw} from "../generated/MasterChef/MasterChef";
import { BigInt } from "@graphprotocol/graph-ts"

export function handleDeposit(event: Deposit): void {
    // only handler for oxdex staking (pid = 0)
    if (event.params.pid != BigInt.fromI32(0)) {
        return
    }

    let entity = ManualOxdexStaking.load(event.params.user.toHex())

    if (!entity) {
        entity = new ManualOxdexStaking(event.params.user.toHex())

        entity.stakeAmount = BigInt.fromI32(0)
    }

    entity.stakeAmount = entity.stakeAmount.plus(event.params.amount)

    entity.save()
}
  
export function handleWithdraw(event: Withdraw): void {
    // only handler for oxdex staking (pid = 0)
    if (event.params.pid != BigInt.fromI32(0)) {
        return
    }

    let entity = ManualOxdexStaking.load(event.params.user.toHex())

    if (!entity) {
        entity = new ManualOxdexStaking(event.params.user.toHex())

        entity.stakeAmount = BigInt.fromI32(0)
    }

    entity.stakeAmount = entity.stakeAmount.minus(event.params.amount)

    entity.save()
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
    // only handler for oxdex staking (pid = 0)
    if (event.params.pid != BigInt.fromI32(0)) {
        return
    }

    let entity = ManualOxdexStaking.load(event.params.user.toHex())

    if (!entity) {
        entity = new ManualOxdexStaking(event.params.user.toHex())

        entity.stakeAmount = BigInt.fromI32(0)
    }

    entity.stakeAmount = entity.stakeAmount.minus(event.params.amount)

    entity.save()
}
  
