// Pole formularza panelu z bledem PRZY KONKRETNYM polu.
// Etykieta pozostaje elementem <label> otaczajacym kontrolke, zgodnie
// z konwencja panelu — dzieki temu nie trzeba zmieniac stylow ani
// struktury pozostalych widokow.

/**
 * @param {object} p
 * @param {string} p.nazwa
 * @param {string} p.etykieta
 * @param {string} [p.blad]
 * @param {string} [p.podpowiedz]
 * @param {import("react").ReactNode} [p.children]
 */
export default function PoleAdmin({ nazwa, etykieta, blad, podpowiedz, children }) {
  const idBledu = blad ? nazwa + "-blad" : undefined;

  return (
    <label className={blad ? "pole-z-bledem" : undefined}>
      {etykieta}
      {children}
      {podpowiedz && <span className="pole-podpowiedz">{podpowiedz}</span>}
      {blad && (
        <span className="pole-blad" id={idBledu} role="alert">
          <span aria-hidden="true">✕</span>
          <span>{blad}</span>
        </span>
      )}
    </label>
  );
}
