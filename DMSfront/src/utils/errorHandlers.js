export const handleRequestErrorAlert = (error) => {
  if (error.code === "ERR_NETWORK" || error.code === undefined) {
    //za "ERR_CONNECTION_REFUSED", error je object ali nema keys
    alert(
      "Došlo je do greške. Molim Vas proverite vezu sa mrežom i pokušajte ponovo.",
    ); //ili ovo isptivanje svuda posebno da bi prikazali unutar forme gresku, a ne u alert
  } else if (error.response?.status === 413) {
    alert(
      "Fajl ili folder je prevelik za otpremanje. Maksimalna veličina je 100MB.",
    );
  }
};
