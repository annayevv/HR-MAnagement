import React, { useState } from "react";
import DocumentForm from "./DocumentForm"; // Komponenti import ediň.

function ParentComponent() {
  const [documents, setDocuments] = useState([]);

  const addDocument = (document) => {
    console.log("Yeni dokument:", document);
    // Şu ýerde, dokumenti sanawa goşmak üçin gerekli kodu yazmaly
    setDocuments((prevDocs) => [...prevDocs, document]);
  };

  return (
    <div>
      {/* DocumentForm'ý "addDocument" funksiyasyny geçirmek */}
      <DocumentForm addDocument={addDocument} />

      {/* Dokumentler sanawy */}
      <div>
        {documents.map((doc, index) => (
          <div key={index}>
            <p>{doc.title}</p>
            <p>{doc.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParentComponent;
