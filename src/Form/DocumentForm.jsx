import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchDocuments,
  deleteDocument,
  checkExpiry,
} from "../api/DocumentFormApi";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { TiDocumentAdd } from "react-icons/ti";
import { LuPencil } from "react-icons/lu";
import { GoTrash } from "react-icons/go";
import { MdFileDownload } from "react-icons/md";

import { GrDocumentPdf } from "react-icons/gr";

const DocumentForm = () => {
  const [documents, setDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(9);
  const navigate = useNavigate();
  const [searchDText, setSearchDText] = useState("");
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await fetchDocuments();
        setDocuments(data);
      } catch (err) {
        console.error("Error fetching documents", err);
      }
    };

    loadDocuments();
  }, []);

  const handleDeleteDocument = (id) => {
    deleteDocument(id)
      .then(() => {
        setDocuments(documents.filter((doc) => doc.id !== id));
      })
      .catch((err) => console.error("Error deleting document", err));
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchDText.toLowerCase())
  );

  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(
    indexOfFirstDocument,
    indexOfLastDocument
  );

  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  return (
    <div className="document-upload bg-black min-h-screen px-4 sm:px-6 py-7">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
        <input
          type="text"
          placeholder={t.docGozleg}
          className="p-3 w-full sm:max-w-md border ml-[34px] border-gray-600 bg-[#0000] rounded-xl mb-3 sm:mb-0 text-white"
          onChange={(e) => {
            setSearchDText(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={() => navigate("/oraz/add-document")}
          className="flex items-center border border-gray-600 rounded-lg bg-[#3E3E3E] text-white px-4 py-2"
        >
          <TiDocumentAdd size={22} className="mr-2" /> {t.docDokumentGos}
        </button>
      </div>
      <div className="shadow-xl rounded-xl mr-[20px] p-4 sm:p-8 space-y-8 mx-auto">
        {filteredDocuments.length === 0 ? (
          <p className="text-gray-500 text-center text-lg">
            Dokument tapylmady
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="text-white p-6 rounded-2xl shadow-lg hover:shadow-xl bg-[#333] flex flex-col space-y-3 group"
              >
                {/* Document Name */}
                <h4 className="text-lg sm:text-xl font-semibold text-center sm:text-left">
                  {doc.name}
                </h4>

                {/* Document Type */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <GrDocumentPdf className="text-[#C9C9C9]" />
                  <p className="text-gray-300 text-sm">{doc.type}</p>
                </div>

                {/* Expiry Date */}
                {doc.expiry_date && (
                  <p
                    className={`text-sm font-medium rounded-lg w-[115px] px-3 py-1 text-center sm:text-left ${
                      checkExpiry(doc.expiry_date) === "Wagty Geçen"
                        ? "text-red-500 border border-red-500"
                        : "text-green-500 border border-green-500"
                    }`}
                  >
                    {checkExpiry(doc.expiry_date) === "Wagty Geçen"
                      ? t.docWagtyGecen
                      : t.docActive}
                  </p>
                )}

                {/* ICON BUTTONS */}
                <div className="flex justify-center sm:justify-start gap-3 mt-2 ml-[200px] ">
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="bg-red-600 p-2 text-white rounded-md hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <GoTrash size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/oraz/edit-document/${doc.id}`)}
                    className="bg-orange-400 p-2 text-white rounded-md hover:bg-orange-500 opacity-0 group-hover:opacity-100 group-hover-bg-[] transition-opacity duration-300"
                  >
                    <LuPencil size={18} />
                  </button>
                  <a
                    href={doc.file_path}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-500 p-2 text-white rounded-md hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <MdFileDownload size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center mt-6">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-l-md hover:bg-gray-400"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {t.docYza}
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`px-4 py-2 ${
                currentPage === index + 1
                  ? "bg-gray-600 text-white"
                  : "bg-gray-200"
              } hover:bg-gray-300 rounded-md mx-1`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-r-md hover:bg-gray-400"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t.docOne}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;
