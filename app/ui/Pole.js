// Pole formularza z etykieta, podpowiedzia i bledem PRZY KONKRETNYM polu.
// Wczesniej komunikat byl jeden, na dole formularza — przy szesciu polach
// uzytkownik musial zgadywac, ktore poprawic.
/**
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.etykieta
 * @param {string} [p.typ]
 * @param {boolean} [p.wymagane]
 * @param {string} [p.podpowiedz]
 * @param {string} [p.blad]
 * @param {(props: object) => import("react").ReactNode} [p.dzieci]
 * @param {any} [p.reszta] pozostale atrybuty trafiaja wprost do kontrolki
 */
export default function Pole(/** @type {any} */ {
  id, etykieta, typ = "text", wymagane = false, podpowiedz = "", blad = "", dzieci = undefined, ...reszta
}) {
  const idBledu = blad ? id + "-blad" : undefined;
  const idPodpowiedzi = podpowiedz ? id + "-podpowiedz" : undefined;
  const opisane = [idPodpowiedzi, idBledu].filter(Boolean).join(" ") || undefined;

  return (
    <div className="pole">
      <label className="pole-etykieta" htmlFor={id}>
        {etykieta}
        {wymagane && <span className="pole-wymagane" aria-hidden="true">*</span>}
        {wymagane && <span className="tylko-dla-czytnika"> (pole wymagane)</span>}
      </label>

      {dzieci ? (
        dzieci({ id, className: "pole-kontrolka", "aria-invalid": blad ? "true" : undefined, "aria-describedby": opisane })
      ) : (
        <input
          id={id}
          type={typ}
          className="pole-kontrolka"
          aria-invalid={blad ? "true" : undefined}
          aria-describedby={opisane}
          required={wymagane}
          {...reszta}
        />
      )}

      {podpowiedz && <span className="pole-podpowiedz" id={idPodpowiedzi}>{podpowiedz}</span>}

      {blad && (
        <p className="pole-blad" id={idBledu}>
          <span aria-hidden="true">✕</span>
          <span>{blad}</span>
        </p>
      )}
    </div>
  );
}
