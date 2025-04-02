/* eslint-disable react/prop-types */
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import upload from "../assets/upload.png";
import { message } from "antd";
import styles from "./updateEmp.module.scss";

const ProfilePicture = ({ avatar, setEmployeeData, isEditMode }) => {
  const [error, setError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      setError("");
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        const isValidType = file.type.startsWith("image/");
        if (!isValidType) {
          message.error("Only image files are allowed.");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          message.error("File size should not exceed 5MB.");
          return;
        }

        setEmployeeData((prev) => ({
          ...prev,
          avatar: file,
        }));
      }
    },
    [setEmployeeData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5 MB
  });

  if (!isEditMode) {
    return (
      avatar && (
        <img
          src={
            avatar instanceof File ? URL.createObjectURL(avatar) : avatar // Direkt gelen URL'yi kullan
          }
          alt="Profile"
          className={styles.previewImage}
        />
      )
    );
  }

  return (
    <div className={styles.profilePictureSection}>
      <div
        {...getRootProps({
          className: styles.dropzone,
          style: {
            borderColor: isDragActive ? "#4A3AFF" : "#d3d3d3",
            opacity: "0.8",
          },
        })}
      >
        <input {...getInputProps()} />
        <div className={styles.uploadIcon}>
          <img src={upload} alt="Upload" />
        </div>
        <p>Drag & drop any file here</p>
        <span>
          or <b>browse file</b> from device
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {avatar && (
        <img
          src={
            avatar instanceof File ? URL.createObjectURL(avatar) : avatar // Direkt gelen URL'yi kullan
          }
          alt="Profile"
          className={styles.previewImage}
        />
      )}
    </div>
  );
};

export default ProfilePicture;
