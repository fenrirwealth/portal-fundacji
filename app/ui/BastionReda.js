import Image from "next/image";
import styl from "./BastionReda.module.css";

export default function BastionReda() {
  return (
    <span className={styl.oznaczenie}>
      <Image src="/partnerzy/bastion-reda.webp" width={36} height={45} alt="" />
      Bastion Reda
    </span>
  );
}
