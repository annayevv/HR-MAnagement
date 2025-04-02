/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchDocumentById,
  fetchEmployees,
  updateDocument,
} from "../api/DocumentFormApi";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { FaChevronRight } from "react-icons/fa";

const EditDocForm = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [employee, setEmployee] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
const fetchData = async () => {
  try {
    setIsLoading(true);

    const doc = await fetchDocumentById(id);
    console.log("Backend-den gelen dokument: ", doc); // Log bilen barla

    if (doc) {
      setName(doc?.data?.name || doc?.name || "");
      setType(doc?.type || "passport");
      setEmployee(doc?.employee_id?.toString() || "");
      if (doc?.expiry_date) {
        setExpiryDate(formatDateToDDMMYYYY(doc.expiry_date));
      } else {
        setExpiryDate(""); 
      }
    }

    const empResponse = await fetchEmployees();
    setEmployees(empResponse || []);
  } catch (err) {
    setError(
      err.response
        ? `Server responded with status ${err.response.status}: ${err.response.data}`
        : "Error fetching data."
    );
  } finally {
    setIsLoading(false);
  }
};

    fetchData();
  }, [id]);

  const formatDateToDDMMYYYY = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

const handleUpdate = async (e) => {
  e.preventDefault();

  try {
    const payload = {
      name,
      type,
      employee_id: Number(employee),
    };

    // expiryDate bar bolsa, formatlap payload-a goş
    if (expiryDate?.trim()) {
      payload.expiry_date = formatDateToDDMMYYYY(expiryDate);
    }

    await updateDocument(id, payload);
    setSuccess("Document updated successfully!");
    navigate("/oraz/DocumentForm");
  } catch (error) {
    setError(error.response?.data?.message || "Error updating document.");
  }
};


  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-start py-6 px-6">
      <div className="w-full flex items-start pl-4 mb-6">
        <span className="flex items-center space-x-2 text-gray-500">
          <h3>{t.docDokumentler}</h3>
          <FaChevronRight size={10} />
          <h3 className="text-white">{t.docUDokUytgetmek}</h3>
        </span>
      </div>

      <div className="flex justify-center w-full mt-10">
        <form
          onSubmit={handleUpdate}
          className="bg-[#1a1a1a] rounded-lg p-2 w-full max-w-[90rem] h-[35rem] text-white"
        >
          <h3 className="text-lg font-semibold mb-6 text-center py-2 bg-gray-500">
            {t.docUDokUytgetmek}
          </h3>

          {isLoading ? (
            <p className="text-center text-white">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 mt-20 mr-16 ml-16">
              <div>
                <label className="block text-sm mb-2">{t.docUDokAdy}</label>
                <input
                  type="text"
                  placeholder="Documentiň ady"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">{t.docUFaykYukle}</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">{t.docAType}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
                >
                  <option>{t.docSayla}</option>
                  <option value="passport">Passport</option>
                  <option value="zagran">Zagran</option>
                  <option value="maglumat">Maglumat</option>
                  <option value="diplom">Diplom</option>
                  <option value="hasiyetnama">Hasiyetnama</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  {t.docUWagtGutarys}
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm mb-2">{t.docASelect}</label>
                <select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
                >
                  <option value="">{t.timeEmp}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded border border-gray-400 text-white hover:bg-gray-600 transition"
            >
              {t.empDYzaGAyt}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded bg-green-700 text-white ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-600 transition"
              }`}
            >
              {isLoading ? "Submitting..." : t.docUUpdate}
            </button>
          </div>

          {success && (
            <p className="text-green-500 mt-4 text-center">{success}</p>
          )}
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditDocForm;
