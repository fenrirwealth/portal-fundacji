CREATE TABLE "PowiadomienieListy" (
"id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "token" TEXT NOT NULL,
"potwierdzony" BOOLEAN NOT NULL DEFAULT false,
"utworzony" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "wyslano" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "PowiadomienieListy_email_key" ON "PowiadomienieListy"("email");
CREATE UNIQUE INDEX "PowiadomienieListy_token_key" ON "PowiadomienieListy"("token");
