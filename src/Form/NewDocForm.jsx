/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployees, postDocument } from "../api/DocumentFormApi";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { FaChevronRight } from "react-icons/fa";

const NewDocForm = () => {
  // States and hooks
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [employee, setEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeesData = async () => {
      try {
        const fetchedEmployees = await fetchEmployees();
        setEmployees(fetchedEmployees);
      } catch (err) {
        setError("Işgärler maglumatyny almakda ýalňyşlyk ýüze çykdy.");
      }
    };
    fetchEmployeesData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !type || !employee) {
      setError("Meýdanlaryň hemmesini dolduryň.");
      return;
    }

    if (Number(employee) <= 0) {
      setError("Işgäri saýlaň.");
      return;
    }

    let formattedExpiryDate = null;
    if (expiryDate) {
      const date = new Date(expiryDate);
      if (!isNaN(date.getTime())) {
        // Convert date to DD-MM-YYYY format
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based
        const year = date.getFullYear();
        formattedExpiryDate = `${day}-${month}-${year}`;
      } else {
        setError("Wagtyň görnüşi nädogry.");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("employee_id", Number(employee));
      formData.append("file", file);

      // Append file only if selected
      if (file) {
        formData.append("file_path", file);
      }

      // Only append expiry_date if it's provided
      if (formattedExpiryDate) {
        formData.append("expiry_date", formattedExpiryDate);
      }

      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      await postDocument(formData);

      setSuccess("Resminama üstünlikli goşuldy!");
      setName("");
      setType("passport");
      setEmployee("");
      setFile(null);
      setExpiryDate("");
      setError("");
      navigate("/oraz/DocumentForm");
    } catch (error) {
      console.error(
        "Error during document upload:",
        error.response?.data || error.message
      );
      setError(
        error.response?.data?.message ||
          "Resminama ýüklemekde problema ýüze çykdy."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-start py-6 px-6">
      <div className="w-full flex items-start pl-4 mb-6">
        <span className="flex items-center space-x-2 text-gray-500">
          <h3>{t.docDokumentler}</h3>
          <FaChevronRight size={10} />
          <h3 className="text-white">{t.docGormek}</h3>
        </span>
      </div>

      <div className="flex justify-center w-full mt-10">
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] rounded-lg p-2 w-full max-w-[90rem] h-[35rem] text-white"
        >
          <h3 className="text-lg font-semibold mb-6 text-center py-2 bg-gray-500 ">
            {t.docAAddDoc}
          </h3>
          <div className="grid grid-cols-2 gap-6 mt-20 mr-16 ml-16">
            <div>
              <label className="block text-sm mb-2">{t.docUDokAdy}</label>
              <input
                type="text"
                placeholder={t.docUDokAdy}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">{t.docAFile}</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">{t.docUGornus}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
              >
                <option value="">{t.docSayla}</option>
                <option value="pasport">pasport</option>
                <option value="zagran">zagran</option>
                <option value="maglumat">{t.adddocmaglumat}</option>
                <option value="diplom">diplom</option>
                <option value="hasiyetnama">hasiyetnama</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">{t.docUWagtGutarys}</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#333] border border-[#555] focus:ring-2 focus:ring-[#888] outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm mb-2">
                {t.docUIsgarSaylamak}
              </label>
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
          <div className="flex justify-end mt-6 gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded border border-gray-400 text-white hover:bg-gray-600 transition"
            >
              {t.docYza}
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-green-700 text-white hover:bg-green-600 transition"
            >
              {t.docYukle}
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

export default NewDocForm;
