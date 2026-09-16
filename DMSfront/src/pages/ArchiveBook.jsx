import React, { useEffect, useState, useCallback } from "react";
import { AiFillEdit, AiFillDelete } from "react-icons/ai";
import { BsInfoCircle, BsUnlockFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import { userRequest, BASE_URL } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import ErrorMessages from "../components/ErrorMessages";
import ModalDelete from "../components/modal/DeleteModal";
import InfoModal from "../components/modal/InfoModal";
import { notifyCreated, notifyUpdated, notifyDeleted } from "../utils/toastNotifications";

// ── Add-year modal ────────────────────────────────────────────────────────────

const AddYearModal = ({ onClose, onSave, suggestedYear, serverError }) => {
  const [year, setYear] = useState(suggestedYear ? String(suggestedYear) : "");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!year || isNaN(year) || Number(year) < 1900 || Number(year) > 2100)
      e.year = "Unesite validnu godinu.";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ year: Number(year) });
  };

  return (
    <div
      className="fixed w-full h-screen z-20 top-0 left-0 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-96 rounded-2xl shadow bg-gray-50 border-4 border-default fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-default mb-3">Dodaj godinu</h2>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-sm font-semibold">Godina</label>
            <input
              className="input-field w-full mt-1"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="npr. 2025"
            />
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
            {serverError && <p className="text-red-500 text-sm mt-1">{serverError}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="button-basic" onClick={handleSave}>Dodaj</button>
          <button className="button-default" onClick={onClose}>Otkaži</button>
        </div>
      </div>
    </div>
  );
};

// ── Details modal ─────────────────────────────────────────────────────────────

const DetailsModal = ({ record: initialRecord, onClose, onRecordUpdate, companyFolder, isAdmin, superAdmin }) => {
  const [record, setRecord] = useState(initialRecord);
  const [startNumber, setStartNumber] = useState(initialRecord.startNumber || "");
  const [expiredStartNumber, setExpiredStartNumber] = useState(initialRecord.expiredStartNumber || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [archiveRowsTable, setArchiveRowsTable] = useState(null);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [lockChoice, setLockChoice] = useState(false);
  const [unlockChoice, setUnlockChoice] = useState(false);
  const [showDeleteExpiredConfirm, setShowDeleteExpiredConfirm] = useState(false);
  const [deleteExpiredChoice, setDeleteExpiredChoice] = useState(false);
  const [showArchiveHelp, setShowArchiveHelp] = useState(false);
  const [showExpiredHelp, setShowExpiredHelp] = useState(false);
  const [showFooterHelp, setShowFooterHelp] = useState(false);

  const locked = !!record.lockedAt;

  // Save start numbers if changed
  const saveStartNumbers = useCallback(async () => {
    if (
      String(startNumber) === String(record.startNumber) &&
      String(expiredStartNumber) === String(record.expiredStartNumber)
    ) return;
    try {
      const resp = await userRequest.put(`archive-book/${record._id}`, {
        startNumber: startNumber !== "" ? Number(startNumber) : undefined,
        expiredStartNumber: expiredStartNumber !== "" ? Number(expiredStartNumber) : undefined,
      });
      notifyUpdated("Knjiga");
      setRecord(resp.data);
      onRecordUpdate(resp.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  }, [record._id, record.startNumber, record.expiredStartNumber, startNumber, expiredStartNumber, onRecordUpdate]);

  const loadArchiveRows = useCallback(async () => {
    setErrors({});
    if (!startNumber || isNaN(startNumber)) {
      setErrors({ message: "Unesite redni broj." });
      return;
    }
    setLoading(true);
    try {
      const resp = await userRequest.post(`archive-book/${record._id}/generate/archive/rows`, {
        startNumber: Number(startNumber),
      });
      const { record: updated, rows } = resp.data;
      setRecord(updated);
      setStartNumber(updated.startNumber || "");
      onRecordUpdate(updated);
      setArchiveRowsTable(rows);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false);
    }
  }, [record._id, startNumber, onRecordUpdate]);

  const generateArchivePdf = useCallback(async () => {
    setErrors({});
    setLoading(true);
    try {
      const napomene = archiveRowsTable.map((r) => ({
        serialNumber: r.serialNumber,
        napomena: r.napomena || "",
      }));
      const resp = await userRequest.post(`archive-book/${record._id}/generate/archive/pdf`, { napomene });
      const { record: updated, folder, filename } = resp.data;
      setRecord(updated);
      onRecordUpdate(updated);
      window.open(`${BASE_URL}document/preview/report/${filename}?folder=${folder}`, "_blank");
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false);
    }
  }, [record._id, archiveRowsTable, onRecordUpdate]);

  const generateExpired = useCallback(async () => {
    setErrors({});
    if (!expiredStartNumber || isNaN(expiredStartNumber)) {
      setErrors({ message: "Unesite redni broj za bezvredni materijal." });
      return;
    }
    setLoading(true);
    try {
      const resp = await userRequest.post(`archive-book/${record._id}/generate/expired`, {
        expiredStartNumber: Number(expiredStartNumber),
      });
      const { record: updated, folder, filename } = resp.data;
      setRecord(updated);
      setExpiredStartNumber(updated.expiredStartNumber || "");
      onRecordUpdate(updated);
      const url = `${BASE_URL}document/preview/report/${filename}?folder=${folder}`;
      window.open(url, "_blank");
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false);
    }
  }, [record._id, expiredStartNumber, onRecordUpdate]);

  const openExistingPdf = (pdfPath) => {
    const filename = pdfPath.split(/[\\/]/).pop();
    const url = `${BASE_URL}document/preview/report/${filename}?folder=${companyFolder}`;
    window.open(url, "_blank");
  };

  // Delete expired documents for the year
  const deleteExpiredDocumentsForYear = useCallback(async () => {
  setErrors({});
  setLoading(true);
  try {
    const startDate = new Date(record.year, 0, 1);
    const endDate = new Date(record.year, 11, 31, 23, 59, 59);
    const params = {
      page: 1,
      limit: 1000,
      sortBy: null,
      sortOrder: true,
      expired: true,
      startdate: startDate,
      enddate: endDate,
    };
    const url = `document/delete/expired?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`;
    await userRequest.delete(url);
    notifyDeleted("Bezvrijedni dokumenti");
  } catch (err) {
    handleRequestErrorAlert(err);
    setErrors({ message: err.response?.data?.error });
  } finally {
    setLoading(false);
  }
}, [record.year]);

  // Lock / unlock
  useEffect(() => {
    if (lockChoice) {
      (async () => {
        setLockChoice(false);
        setLoading(true);
        try {
          const resp = await userRequest.put(`archive-book/${record._id}/lock`);
          setRecord(resp.data);
          onRecordUpdate(resp.data);
          // Check if year has expired rows - show delete modal
          if ((isAdmin || superAdmin) && resp.data.expiredRows && resp.data.expiredRows.length > 0) {
            setShowDeleteExpiredConfirm(true);
          }
        } catch (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [lockChoice, record._id, onRecordUpdate, isAdmin, superAdmin]);

  useEffect(() => {
    if (deleteExpiredChoice) {
      (async () => {
        setDeleteExpiredChoice(false);
        await deleteExpiredDocumentsForYear();
      })();
    }
  }, [deleteExpiredChoice, deleteExpiredDocumentsForYear]);

  useEffect(() => {
    if (unlockChoice) {
      (async () => {
        setUnlockChoice(false);
        setLoading(true);
        try {
          const resp = await userRequest.put(`archive-book/${record._id}/unlock`);
          setRecord(resp.data);
          onRecordUpdate(resp.data);
        } catch (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [unlockChoice, record._id, onRecordUpdate]);

  return (
    <div
      className="fixed w-full h-screen z-20 top-0 left-0 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-3/4 max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow bg-gray-50 border-4 border-default fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-default">
              Arhivska knjiga — {record.year}
            </h2>
            <button
              className="p-1 hover:bg-gray-200 rounded cursor-pointer"
              onClick={() => setShowFooterHelp(true)}
              title="Pomoć"
            >
              <BsInfoCircle size={18} className="text-default" />
            </button>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              locked ? "bg-gray-300 text-gray-700" : "bg-green-200 text-green-800"
            }`}
          >
            {locked ? "Zatvoreno" : "Otvoreno"}
          </span>
        </div>

        <ErrorMessages errors={errors} />

        {/* ── Arhivska knjiga section ── */}
        <div className="border-2 border-gray-400 rounded-lg p-3 mb-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-default">Arhivska knjiga</h3>
            <button
              className="p-1 hover:bg-gray-200 rounded cursor-pointer"
              onClick={() => setShowArchiveHelp(true)}
              title="Pomoć"
            >
              <BsInfoCircle size={18} className="text-default" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-semibold">Redni broj</label>
              <input
                className={`input-field w-full mt-1 ${locked ? "bg-gray-200 cursor-not-allowed" : ""}`}
                type="number"
                value={startNumber}
                readOnly={locked}
                onChange={(e) => setStartNumber(e.target.value)}
                onBlur={locked ? undefined : saveStartNumbers}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Poslednji redni broj</label>
              <input
                className="input-field w-full mt-1 bg-gray-200 cursor-not-allowed"
                type="number"
                value={record.endNumber || ""}
                readOnly
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="button-basic"
              disabled={locked || loading}
              onClick={loadArchiveRows}
            >
              Generiši
            </button>
            {record.pdfPath && (
              <button
                className="button-default"
                onClick={() => openExistingPdf(record.pdfPath)}
              >
                Pregledaj PDF
              </button>
            )}
          </div>

          {archiveRowsTable && (
            <div className="mt-2">
              <div className="border rounded overflow-auto max-h-48">
                <table className="text-sm w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-center border-b">Rbr.</th>
                      <th className="px-2 py-1 text-left border-b">Kategorija</th>
                      <th className="px-2 py-1 text-left border-b">Napomena</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveRowsTable.map((row, idx) => (
                      <tr key={idx} className="border-t odd:bg-gray-50">
                        <td className="px-2 py-1 text-center">{row.serialNumber}.</td>
                        <td className="px-2 py-1">{row.categoryName}</td>
                        <td className="px-2 py-1">
                          <input
                            className="input-field w-full py-0 text-sm"
                            value={row.napomena || ""}
                            onChange={(e) => {
                              const updated = [...archiveRowsTable];
                              updated[idx] = { ...updated[idx], napomena: e.target.value };
                              setArchiveRowsTable(updated);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="button-basic"
                  disabled={loading}
                  onClick={generateArchivePdf}
                >
                  Generiši PDF
                </button>
                <button
                  className="button-default"
                  onClick={() => setArchiveRowsTable(null)}
                >
                  Otkaži
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bezvredni materijal section ── */}
        <div className="border-2 border-gray-400 rounded-lg p-3 mb-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-default">Bezvredni materijal</h3>
            <button
              className="p-1 hover:bg-gray-200 rounded cursor-pointer"
              onClick={() => setShowExpiredHelp(true)}
              title="Pomoć"
            >
              <BsInfoCircle size={18} className="text-default" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-semibold">Redni broj</label>
              <input
                className={`input-field w-full mt-1 ${locked ? "bg-gray-200 cursor-not-allowed" : ""}`}
                type="number"
                value={expiredStartNumber}
                readOnly={locked}
                onChange={(e) => setExpiredStartNumber(e.target.value)}
                onBlur={locked ? undefined : saveStartNumbers}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Poslednji redni broj</label>
              <input
                className="input-field w-full mt-1 bg-gray-200 cursor-not-allowed"
                type="number"
                value={record.expiredEndNumber || ""}
                readOnly
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="button-basic"
              disabled={locked || loading}
              onClick={generateExpired}
            >
              Generiši PDF
            </button>
            {record.expiredPdfPath && (
              <button
                className="button-default"
                onClick={() => openExistingPdf(record.expiredPdfPath)}
              >
                Pregledaj PDF
              </button>
            )}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex justify-between items-center mt-2">
          <button className="button-default" onClick={onClose}>
            Otkaži
          </button>
          <div className="flex gap-2">
            {!locked && (isAdmin || superAdmin) && (
              <button
                className="button-basic-sky"
                onClick={() => setShowLockConfirm(true)}
                disabled={loading}
              >
                Zatvori godinu
              </button>
            )}
            {locked && superAdmin && (
              <button
                className="button-basic-sky"
                onClick={() => setShowUnlockConfirm(true)}
                disabled={loading}
              >
                Otvori godinu
              </button>
            )}
          </div>
        </div>
      </div>

      {showLockConfirm && (
        <ModalDelete
          setModalOn={setShowLockConfirm}
          setChoice={setLockChoice}
          color="green"
          modalMessage="Zatvorite godinu ako je arhivska knjiga uspešno predata bez zamerki."
        />
      )}
      {showUnlockConfirm && (
        <ModalDelete
          setModalOn={setShowUnlockConfirm}
          setChoice={setUnlockChoice}
          modalMessage={`Da li želite otvoriti godinu ${record.year}?`}
        />
      )}
      {showDeleteExpiredConfirm && (
        <ModalDelete
          setModalOn={setShowDeleteExpiredConfirm}
          setChoice={setDeleteExpiredChoice}
          modalMessage="Ako je izveštaj bezvrednog materijala ispravan, obrišite istekle dokumente?"
        />
      )}

      {showArchiveHelp && (
        <InfoModal
          onClose={() => setShowArchiveHelp(false)}
          sections={[
            {
              header: "Redni broj",
              text: "Potrebno uneti redni broj za prvu godinu unosa, tako da se nastavlja na prethodnu godinu, poslednji redni broj prethodne godine + 1. Kada se preda arhivska knjiga godine i godina zatvori, pri otvaranju nove redni broj će biti automatski postavljen u odnosu na prethodnu godinu.",
            },
            {
              header: "Poslednji redni broj",
              text: "Nije moguća izmena, automatski se postavlja na osnovu broja kategorija u arhivskoj knjizi.",
            },
            {
              header: "Generiši",
              text: "Klikom na dugme 'Generiši' kreirate pregled svih redova koji će biti uključeni u arhivsku knjiga na osnovu unetog rednog broja. Zatim možete dodati napomene za svaki red ako je potrebno.",
            },
            {
              header: "Generiši PDF",
              text: "Nakon što ste pregledali redove i eventualno dodali napomene, klikom na 'Generiši PDF' kreirate PDF dokument arhivske knjige koji se otvara u novom prozoru, gde možete pregledati i sačuvati dokument.",
            },
            {
              header: "Pregledaj PDF",
              text: "Ako je arhivska knjiga već generisana, klikom na 'Pregledaj PDF' otvara se prethodno generisani PDF dokument arhivske knjige.",
            },
          ]}
        />
      )}

      {showExpiredHelp && (
        <InfoModal
          onClose={() => setShowExpiredHelp(false)}
          sections={[
            {
              header: "Redni broj",
              text: "Potrebno uneti redni broj za prvu godinu unosa, tako da se nastavlja na prethodnu godinu, poslednji redni broj prethodne godine + 1. Kada se preda arhivska knjiga godine i godina zatvori, pri otvaranju nove redni broj će biti automatski postavljen u odnosu na prethodnu godinu.",
            },
            {
              header: "Generiši PDF",
              text: "Klikom na dugme 'Generiši' kreirate izveštaj svih dokumenata koji su istekli.",
            },
            {
              header: "Pregledaj PDF",
              text: "Ako je arhivska knjiga već generisana, klikom na 'Pregledaj PDF' otvara se prethodno generisani PDF dokument arhivske knjige.",
            },
          ]}
        />
      )}

      {showFooterHelp && (
        <InfoModal
          onClose={() => setShowFooterHelp(false)}
          sections={[
            {
              header: "Zatvori godinu",
              text: "Nakon što predate arhivsku knjigu i ako je sve prošlo kako treba. Klikom na 'Zatvori godinu' arhivska knjiga za tekuću godinu se zaključava i više nije moguće dodavati ili menjati redove. Tada možete otvoriti narednu godinu.",
            },
            {
              header: "Brisanje isteklih dokumenata",
              text: "Ako je izveštaj ispravan i sigurni ste da se dokumenti mogu obrisati, potvrdom 'Zatvori godinu' sistem će automatski obrisati (biće u obrisani dokumenti) sve istekle dokumente iz arhive za tu godinu.",
            },
          ]}
        />
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ArchiveBookPage = () => {
  const [records, setRecords] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalError, setAddModalError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteChoice, setDeleteChoice] = useState(false);
  const [recordToUnlock, setRecordToUnlock] = useState(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlockChoice, setUnlockChoice] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalOnInfo, setModalOnInfo] = useState(false);

  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user && user.isAdmin;
  const superAdmin = user && user.superAdmin;
  const companyFolder = useSelector((state) => state.company?.currentCompany?.folderName);

  const getRecords = useCallback(async () => {
    try {
      const resp = await userRequest.get("archive-book");
      setRecords(resp.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  }, []);

  useEffect(() => {
    getRecords();
    document.title = "ARHIVSKA KNJIGA";
  }, [getRecords]);

  // Suggested year for the add modal (max existing year + 1)
  const suggestedYear = records.length > 0
    ? Math.max(...records.map((r) => r.year)) + 1
    : new Date().getFullYear();

  const handleAddYear = useCallback(async ({ year }) => {
    setErrors({});
    setAddModalError("");
    try {
      const resp = await userRequest.post("archive-book", { year });
      const newRecord = resp.data;
      notifyCreated("Knjiga");
      setRecords((prev) => [newRecord, ...prev].sort((a, b) => b.year - a.year));
      setShowAddModal(false);
      setSelectedRecord(newRecord);
    } catch (err) {
      const msg = err.response?.data?.error || "Greška pri dodavanju godine.";
      setAddModalError(msg);
    }
  }, []);

  const handleDeleteYear = useCallback(async () => {
    if (!recordToDelete) return;
    setErrors({});
    try {
      await userRequest.delete(`archive-book/${recordToDelete._id}`);
      notifyDeleted("Knjiga");
      setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id));
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setRecordToDelete(null);
      setShowDeleteModal(false);
    }
  }, [recordToDelete]);

  useEffect(() => {
    if (deleteChoice) {
      setDeleteChoice(false);
      handleDeleteYear();
    }
  }, [deleteChoice, handleDeleteYear]);

  const handleUnlockYear = useCallback(async () => {
    if (!recordToUnlock) return;
    setErrors({});
    try {
      const resp = await userRequest.put(`archive-book/${recordToUnlock._id}/unlock`);
      setRecords((prev) => prev.map((r) => (r._id === resp.data._id ? resp.data : r)));
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setRecordToUnlock(null);
      setShowUnlockConfirm(false);
    }
  }, [recordToUnlock]);

  useEffect(() => {
    if (unlockChoice) {
      setUnlockChoice(false);
      handleUnlockYear();
    }
  }, [unlockChoice, handleUnlockYear]);

  const handleRecordUpdate = useCallback((updated) => {
    setRecords((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    if (selectedRecord?._id === updated._id) setSelectedRecord(updated);
  }, [selectedRecord]);

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Uredi" />,
      text: "Otvori detalje godine (arhivska knjiga i bezvredni materijal)",
      buttonClass: "edit",
    },
  ];

  return (
    <>
      <div className="px-2 py-1 border-2 border-default rounded-lg bg-white">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl text-default font-bold">ARHIVSKA KNJIGA</h1>
            <button
              className="button-basic"
              onClick={() => setShowAddModal(true)}
            >
              + Dodaj godinu
            </button>
          </div>
          <p onClick={() => setModalOnInfo(true)} className="cursor-pointer">
            <BsInfoCircle title="Informacije" className="text-default text-2xl" />
          </p>
        </div>
        <ErrorMessages errors={errors} />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 items-center justify-between pl-2 mt-1">
        <div className="column-default-header">Godina</div>
        <div className="column-default-header">Redni br. od — do</div>
        <div className="column-default-header">Status</div>
        <div className="column-default-header text-right pr-2"></div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-160px)]">
        <ul>
          {records.map((record) => (
            <li
              key={record._id}
              className="grid grid-cols-4 row-properties items-center"
              onDoubleClick={() => setSelectedRecord(record)}
            >
              <p className="px-1 font-semibold">{record.year}</p>
              <p className="px-1 text-sm">
                {record.startNumber || "—"}
                {record.endNumber ? ` — ${record.endNumber}` : ""}
              </p>
              <div className="px-1">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    record.lockedAt
                      ? "bg-gray-300 text-gray-700"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  {record.lockedAt ? "Zatvoreno" : "Otvoreno"}
                </span>
              </div>
              <div className="flex justify-end gap-1 pr-2">
                <button
                  className="button-edit"
                  onClick={() => setSelectedRecord(record)}
                  title="Detalji"
                >
                  <AiFillEdit size={20} />
                </button>
                {record.lockedAt && superAdmin && (
                  <button
                    className="button-delete ml-1"
                    title="Otvori godinu"
                    onClick={() => { setRecordToUnlock(record); setShowUnlockConfirm(true); }}
                  >
                    <BsUnlockFill size={18} />
                  </button>
                )}
                {!record.lockedAt && (isAdmin || superAdmin) && (
                  <button
                    className="button-delete ml-1"
                    title="Obriši godinu"
                    onClick={() => { setRecordToDelete(record); setShowDeleteModal(true); }}
                  >
                    <AiFillDelete size={18} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showAddModal && (
        <AddYearModal
          onClose={() => { setShowAddModal(false); setAddModalError(""); }}
          onSave={handleAddYear}
          suggestedYear={suggestedYear}
          serverError={addModalError}
        />
      )}

      {selectedRecord && (
        <DetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onRecordUpdate={handleRecordUpdate}
          companyFolder={companyFolder}
          isAdmin={isAdmin}
          superAdmin={superAdmin}
        />
      )}

      {showUnlockConfirm && recordToUnlock && (
        <ModalDelete
          setModalOn={setShowUnlockConfirm}
          setChoice={setUnlockChoice}
          modalMessage={`Da li želite otvoriti godinu ${recordToUnlock.year}?`}
        />
      )}

      {showDeleteModal && recordToDelete && (
        <ModalDelete
          setModalOn={setShowDeleteModal}
          setChoice={setDeleteChoice}
          modalMessage={`Da li želite obrisati godinu ${recordToDelete.year}? Ova akcija se ne može poništiti.`}
        />
      )}

      {modalOnInfo && (
        <InfoModal
          onClose={() => setModalOnInfo(false)}
          sections={sectionsInfo}
        />
      )}
    </>
  );
};

export default ArchiveBookPage;
