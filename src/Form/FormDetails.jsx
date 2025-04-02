import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { postDocument } from "../api/DocumentFormApi";
import { IoMdClose } from "react-icons/io";
import { FaUpload } from "react-icons/fa";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";

const FormDetails = ({ employeeId: propEmployeeId }) => {
  const { id: paramEmployeeId } = useParams();
  const employeeId = propEmployeeId || paramEmployeeId;

  const [formData, setFormData] = useState({
    name: "",
    type: "passport",
    expiry_date: "",
    file: null,
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.file) {
      setError("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("token");

    // Senäni "DD-MM-YYYY" formatyna öwürýäris
    const formattedExpiryDate = formData.expiry_date
      ? formData.expiry_date.split("-").reverse().join("-")
      : "";

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("employee_id", String(employeeId));
    formDataToSend.append("expiry_date", formattedExpiryDate);
    formDataToSend.append("file", formData.file);

    try {
      await postDocument(formDataToSend, token);
      setSuccess("Document added successfully!");
      setError("");
      window.location.reload();
    } catch (err) {
      setError("Error during document upload.");
    }
  };

  return (
    <div className="p-6 bg-[#3E3E3E] shadow-md rounded-md relative">
      <button
        onClick={() => navigate(window.location.reload())}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
      >
        <IoMdClose size={24} />
      </button>

      <h3 className="text-lg font-bold text-gray-800 mb-4">{t.addDocument}</h3>
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white font-medium">
            {t.docUDokAdy}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full text-black px-3 py-2 border rounded"
            placeholder={t.documentNamePlaceholder}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-white font-medium">
            {t.docUGornus}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 text-black py-2 border rounded"
            required
          >
            <option value="">{t.docSayla}</option>
            <option value="pasport">pasport</option>
            <option value="zagran">zagran</option>
            <option value="maglumat">maglumat</option>
            <option value="diplom">diplom</option>
            <option value="hasiyetnama">hasiyetnama</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-white font-medium">
            {t.docUWagtGutarys}
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="w-full px-3 text-black py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{t.docUFaykYukle}</label>
          <input
            type="file"
            name="file"
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full flex items-center justify-center"
        >
          <FaUpload className="mr-2" size={20} /> {t.addDocument}
        </button>
      </form>
    </div>
  );
};

export default FormDetails;
