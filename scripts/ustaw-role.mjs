import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const email = String(process.argv[2] || "").trim().toLowerCase();
const rola = String(process.argv[3] || "ZARZAD").trim().toUpperCase();

if (!email || !["DARCZYNCA", "REDAKCJA", "ZARZAD"].includes(rola)) {
  console.error("Uzycie: npm run admin:set-role -- osoba@example.com ZARZAD");
  process.exitCode = 2;
} else {
  try {
    const wynik = await db.user.updateMany({ where: { email }, data: { rola } });
    if (wynik.count !== 1) {
      console.error("Nie znaleziono dokladnie jednego konta. Najpierw zaloguj sie tym adresem do portalu.");
      process.exitCode = 1;
    } else {
      console.log(`Ustawiono role ${rola} dla ${email}.`);
    }
  } finally {
    await db.$disconnect();
  }
}
