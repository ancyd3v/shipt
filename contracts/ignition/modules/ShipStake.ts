import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ShipStakeModule", (m) => {
  const resolver = m.getParameter("resolver");
  const forfeiturePool = m.getParameter("forfeiturePool");

  const shipStake = m.contract("ShipStake", [resolver, forfeiturePool]);

  return { shipStake };
});